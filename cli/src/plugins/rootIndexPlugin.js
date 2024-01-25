import { getDepConfig } from "@preact/benchmark-deps";
import { readdir } from "node:fs/promises";
import { repoRoot } from "../utils.js";

/** @type {() => Promise<RootConfig["apps"]>} */
async function getAppConfig() {
	const appNames = (await readdir(repoRoot("apps"), { withFileTypes: true }))
		.filter(
			(e) =>
				e.isDirectory() && !e.name.startsWith("_") && e.name !== "node_modules"
		)
		.map((e) => e.name);

	/** @type {RootConfig["apps"]} */
	const apps = {};
	for (let appName of appNames) {
		const appContents = await readdir(repoRoot(`apps/${appName}/`), {
			withFileTypes: true,
		});

		/** @type {Record<string, string>} */
		const benchmarks = {};
		/** @type {Record<string, string>} */
		const implementations = {};
		for (let dirEntry of appContents) {
			if (dirEntry.isFile() && dirEntry.name.endsWith(".html")) {
				benchmarks[dirEntry.name] = `apps/${appName}/${dirEntry.name}`;
			}

			if (dirEntry.isDirectory() && !dirEntry.name.startsWith("_")) {
				implementations[dirEntry.name] = `apps/${appName}/${dirEntry.name}`;
			}
		}

		apps[appName] = {
			benchmarks,
			implementations,
		};
	}

	return apps;
}

/** @type {() => import('vite').Plugin} */
export function rootIndexPlugin() {
	return {
		name: "preact-benchmark:config",
		async transformIndexHtml(html, ctx) {
			if (ctx.path !== "/" && ctx.path !== "/index.html") return;

			const apps = await getAppConfig();
			const dependencies = await getDepConfig();
			/** @type {RootConfig} */
			const config = { apps, dependencies };

			return html.replace(/__CONFIG_DATA__/g, JSON.stringify(config));
		},
	};
}
