import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs/promises";
import * as resolve from "resolve.exports";
import { URLPattern } from "urlpattern-polyfill";
import { depFilePath, repoRoot, toURLPath } from "../utils.js";
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
	"https://localhost:/apps/:appName/:benchmarkName"
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
	const importSpecifier = toDepImportMapId(dep);
	importMap.imports[importSpecifier] = toURLPath(depDir(main));

	for (let subPkg of Object.keys(pkg.exports ?? {})) {
		const subPkgPath = resolve.exports(pkg, subPkg)?.[0];
		if (!subPkgPath) continue;

		const importSpecifier = toDepImportMapId(path.posix.join(dep, subPkg));
		importMap.imports[importSpecifier] = toURLPath(depDir(subPkgPath));
	}

	return importMap;
}

/**
 * Plugin to insert an import map into benchmark HTML files to map dependencies
 * to requested versions, as well as map the "app" import specifier to the
 * requested implementation
 * @type {() => import('vite').Plugin}
 */
export function dependencyPlugin() {
	return {
		name: "preact-benchmark:dependency",
		async resolveId(source, importer) {
			if (!importer) return;
			if (!importer.startsWith(repoRoot("apps"))) return;

			// TODO: Maybe precalculate this when running benchmarks? and do it live
			// in dev mode?
			const depConfig = await getDepConfig();
			const dependencies = Object.keys(depConfig);

			if (source === "@impl") {
				// This is the app import. Map it to the requested implementation
				return implImportPrefix;
			} else if (
				dependencies.includes(source) ||
				dependencies.includes(source.split("/")[0])
			) {
				// This source url needs to be mapped. Mark for mapping by giving it a
				// prefix that the importmap will use to map it.
				return toDepImportMapId(source);
			}
		},
		async load(id) {
			if (!id.startsWith(depImportPrefix) && id !== implImportPrefix) return;
			return `throw new Error("This code should never execute because the injected browser importmap should resolve this URL (${id}) to a different path. Please report a bug.");`;
		},
		async transformIndexHtml(html, ctx) {
			if (ctx.path === "/" || ctx.path === "/index.html") return;
			if (!ctx.originalUrl) return;

			const url = new URL(ctx.originalUrl, "https://localhost/");
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

			// Add the app import
			const impl = params.get("impl") ?? "";
			importMap.imports[implImportPrefix] = toURLPath(
				require.resolve(repoRoot("apps", appName, impl))
			);

			for (let [key, value] of params) {
				if (!key.startsWith("dep:")) continue;

				const dep = key.slice(4);
				const version = value;

				const depImportMap = await getImportMapForDep(dep, version);
				importMap.imports = { ...importMap.imports, ...depImportMap.imports };
			}

			// Serialize import map and fix indentation so it looks nice when debugging
			const importMapString = JSON.stringify(importMap, null, 2)
				.replace(/  /g, "\t")
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
