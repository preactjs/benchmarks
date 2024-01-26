import { createRequire } from "node:module";
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
const resolve = require.resolve;

const pattern = new URLPattern(
	"https://localhost:/apps/:appName/:benchmarkName"
);

/**
 * Plugin to insert an import map into benchmark HTML files to map dependencies
 * to requested versions, as well as map the "app" import specifier to the
 * requested implementation
 * @type {() => import('vite').Plugin}
 */
export function dependencyPlugin() {
	const depImportPrefix = `/@dep/`;
	const implImportPrefix = `/@impl`;

	/** @type {(dep: string) => string} */
	const toDepImportMapId = (dep) => `${depImportPrefix}${dep}`;

	return {
		name: "preact-benchmark:dependency",
		async resolveId(source, importer) {
			if (!importer) return;
			if (!importer.startsWith(repoRoot("apps"))) return;

			// TODO: Maybe precaluclate this when running benchmarks? and do it live
			// in dev mode?
			const depConfig = await getDepConfig();

			if (source === "@impl") {
				// This is the app import. Map it to the requested implementation
				return implImportPrefix;
			} else if (depConfig[source]) {
				// TODO: `depConfig[source]` won't work for nested imports: `preact/hooks`

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
				resolve(repoRoot("apps", appName, impl))
			);

			for (let [key, value] of params) {
				if (!key.startsWith("dep:")) continue;

				const dep = key.slice(4);
				const version = value;

				const importMapId = toDepImportMapId(dep);
				const actualDepUrl = toURLPath(resolve(depFilePath(dep, version)));
				importMap.imports[importMapId] = actualDepUrl;

				// TODO: What do we need to add here for this? Might need to extend
				// `getDepConfig` to include subpackage paths
				//
				// importMap.imports[importMapId + "/"] =
				// 	toURLPath(depFilePath(dep, version)) + "/";
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
