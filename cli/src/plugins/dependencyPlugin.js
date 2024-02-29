import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs/promises";
import * as resolve from "resolve.exports";
import { URLPattern } from "urlpattern-polyfill";
import { depFilePath, parseDepVersion, repoRoot, toURLPath } from "../utils.js";
import { getDepConfig } from "../config.js";

/** @type {(...args: any[]) => any} */
const compileModule = (module, filename) => {
	return module._compile(`export * from "${filename}";`, filename);
};

const require = createRequire(import.meta.url);
require.extensions[".jsx"] = compileModule;
require.extensions[".tsx"] = compileModule;
require.extensions[".ts"] = compileModule;

const pattern = new URLPattern(
	"http://localhost:/apps/:appName/:benchmarkName",
);

const depImportPrefix = `/@dep/`;
const implImportPrefix = `/@impl`;

/**
 * Take a bare import specifier and mark it as a dependency our plugin will
 * handle by prefixing it.
 * @type {(dep: string) => string}
 */
const toDepImportMapId = (dep) => `${depImportPrefix}${dep}`;

/**
 * For a given dependency and version, generate an import map that maps the
 * top-level imports into a concrete url path (e.g. `/@dep/preact` with version
 * `latest` maps to `/dependencies/preact/latest/index.js`). It also adds
 * mappings for any subpaths defined in the package.json for the dependency.
 * @type {(dep: string, version: string) => Promise<ImportMap>}
 */
async function getImportMapForDep(dep, version) {
	/** @type {(...args: string[]) => string} */
	const depDir = (...args) => depFilePath(dep, version, ...args);
	const pkgPath = depDir("package.json");
	const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"));

	const main = resolve.exports(pkg, ".")?.[0];
	if (!main) throw new Error(`Could not resolve main for ${dep}@${version}`);

	/** @type {ImportMap} */
	const importMap = { imports: {} };
	importMap.imports[toDepImportMapId(dep)] = toURLPath(depDir(main));

	for (let subPkg of Object.keys(pkg.exports ?? {})) {
		const subPkgPath = resolve.exports(pkg, subPkg)?.[0];
		if (!subPkgPath) continue;

		const bareSpecifier = path.posix.join(dep, subPkg);
		const depImportMapId = toDepImportMapId(bareSpecifier);
		importMap.imports[depImportMapId] = toURLPath(depDir(subPkgPath));
	}

	return importMap;
}

/**
 * Plugin to insert an import map into benchmark HTML files to map dependencies
 * to requested versions, as well as map the "@impl" import specifier to the
 * requested implementation
 * @type {() => import('vite').Plugin}
 */
export function dependencyPlugin() {
	return {
		name: "preact-benchmark:dependency",
		resolveId: {
			// Run this plugin in `pre` mode so we can reroute imports from within
			// node_module folders to ensure every nested import of preact, etc. gets
			// the requested version.
			order: "pre",
			async handler(id, importer) {
				if (!importer) return;

				// Only reroute imports from 1) apps directory (aka benchmark
				// implementations) which will import the libraries whose versions we
				// want to control, and 2) files in pnpm's node_modules folder. We reroute
				// imports from pnpm's node_modules folder because we want to control
				// the versions other libraries import as well. For example, if an
				// implementation imports @preact/signals, we need to sure when
				// @preact/signals imports preact/hooks, it imports the version we
				// want, and not the version it was installed with.
				if (
					!importer.startsWith(repoRoot("apps")) &&
					!importer.startsWith(repoRoot("node_modules", ".pnpm"))
				) {
					return;
				}

				// TODO: Maybe precalculate this when running benchmarks? and do it live
				// in dev mode?
				const depConfig = await getDepConfig();
				const dependencies = Object.keys(depConfig);

				/** @type {string | undefined} */
				let resolvedId;
				if (id === "@impl") {
					// This is the impl import. Map it to the requested implementation
					resolvedId = implImportPrefix;
				} else if (
					dependencies.includes(id) ||
					// ⬇️ handle subpackage imports, e.g. `preact/hooks` where `preact` is the entry in the depConfig
					dependencies.includes(id.split("/")[0])
				) {
					// This source url needs to be mapped. Mark for mapping by giving it a
					// prefix that the importmap will use to map it.
					resolvedId = toDepImportMapId(id);
				}

				// console.log(`[resolveId]`, { id, importer, resolvedId });
				return resolvedId;
			},
		},
		async load(id) {
			if (!id.startsWith(depImportPrefix) && id !== implImportPrefix) return;
			return `throw new Error("This code should never execute because the injected browser importmap should resolve this URL (${id}) to a different path. Please report a bug.");`;
		},
		async transformIndexHtml(html, ctx) {
			if (ctx.path === "/" || ctx.path === "/index.html") return;
			if (!ctx.originalUrl) return;

			const url = new URL(ctx.originalUrl, "http://localhost/");
			const match = pattern.exec(url);
			if (!match) return;

			const appName = match.pathname.groups.appName;
			const benchmarkName = match.pathname.groups.benchmarkName;
			const params = url.searchParams;

			// TODO: throw error if appName or benchmarkName is missing
			if (!appName) return;
			if (!benchmarkName) return;

			/** @type {ImportMap} */
			const importMap = { imports: {} };

			// Add the impl import
			const impl = params.get("impl") ?? "";
			importMap.imports[implImportPrefix] = toURLPath(
				require.resolve(repoRoot("apps", appName, impl)),
			);

			const depConfig = await getDepConfig();
			const specifiedDeps = params.getAll("dep").map((v) => parseDepVersion(v));

			// Specify an import map for each dependency, defaulting unspecified ones to "latest"
			for (const depName of Object.keys(depConfig)) {
				const version =
					specifiedDeps.find(([name]) => name === depName)?.[1] ?? "latest";
				const depImportMap = await getImportMapForDep(depName, version);
				importMap.imports = { ...importMap.imports, ...depImportMap.imports };
			}

			// console.log(importMap);

			// Serialize import map and fix indentation so it looks nice when debugging
			const importMapString = JSON.stringify(importMap, null, 2)
				.replace(/ {2}/g, "\t")
				.replace(/\n/g, "\n\t\t");

			return {
				html,
				tags: [
					{
						tag: "script",
						attrs: { type: "importmap" },
						children: importMapString,
					},
				],
			};
		},
	};
}
