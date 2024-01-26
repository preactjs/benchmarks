import { createRequire } from "node:module";
import { depFilePath, repoRoot, toURLPath } from "../utils.js";
import { getDepConfig } from "../config.js";

const resolve = createRequire(import.meta.url).resolve;

/**
 * Plugin to insert an import map into benchmark HTML files to map dependencies
 * to requested versions, as well as map the "app" import specifier to the
 * requested implementation
 * @type {() => import('vite').Plugin}
 */
export function dependencyPlugin() {
	const importMapPrefix = `/@dep/`;
	/** @type {(dep: string) => string} */
	const toImportMapId = (dep) => `${importMapPrefix}${dep}`;

	return {
		name: "preact-benchmark:dependency",
		async resolveId(source, importer) {
			console.log("[resolveId]", source, importer);

			if (!importer) return;
			if (!importer.startsWith(repoRoot("apps"))) return;

			const depConfig = await getDepConfig();
			if (depConfig[source]) {
				// This source url needs to be mapped. Mark for mapping by giving it a
				// prefix that the importmap will use to map it.
				return toImportMapId(source);
			}
		},
		async load(id) {
			if (!id.startsWith(importMapPrefix)) return;

			console.log("[load]", id);
			return `throw new Error("This code should never execute because browser import maps should be redirecting this URL instead. Please report a bug");`;
		},
		async transformIndexHtml(html, ctx) {
			if (ctx.path === "/" || ctx.path === "/index.html") return;
			if (!ctx.originalUrl) return;

			/** @type {ImportMap} */
			const importMap = { imports: {} };

			const url = new URL(ctx.originalUrl, "https://localhost:/");
			for (let [key, value] of url.searchParams) {
				if (!key.startsWith("dep-")) continue;

				const dep = key.slice(4);
				const version = value;

				const importMapId = toImportMapId(dep);
				const actualDepUrl = toURLPath(resolve(depFilePath(dep, version)));
				importMap.imports[importMapId] = actualDepUrl;
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
