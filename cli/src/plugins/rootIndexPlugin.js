import { readdir } from "node:fs/promises";
import { repoRoot } from "../utils.js";

/** @type {(...args: string[]) => string} */
const appPath = (...args) => repoRoot("apps", ...args);
/** @type {(...args: string[]) => string} */
const depPath = (...args) => repoRoot("dependencies", ...args);

/** @type {(name: string) => boolean} */
function shouldIgnore(name) {
	return (
		name === "node_modules" || name.startsWith("_") || name.startsWith(".")
	);
}

/** @type {() => Promise<RootConfig["apps"]>} */
async function getAppConfig() {
	const appNames = (await readdir(appPath(), { withFileTypes: true }))
		.filter((e) => e.isDirectory() && !shouldIgnore(e.name))
		.map((e) => e.name);

	/** @type {RootConfig["apps"]} */
	const apps = {};
	for (let appName of appNames) {
		const appContents = await readdir(appPath(appName), {
			withFileTypes: true,
		});

		/** @type {Record<string, string>} */
		const benchmarks = {};
		/** @type {Record<string, string>} */
		const implementations = {};
		for (let dirEntry of appContents) {
			if (
				dirEntry.isFile() &&
				dirEntry.name.endsWith(".html") &&
				!shouldIgnore(dirEntry.name)
			) {
				benchmarks[dirEntry.name] = appPath(appName, dirEntry.name);
			}

			if (dirEntry.isDirectory() && !shouldIgnore(dirEntry.name)) {
				implementations[dirEntry.name] = appPath(appName, dirEntry.name);
			}
		}

		apps[appName] = {
			benchmarks,
			implementations,
		};
	}

	return apps;
}

/**
 * @returns {Promise<RootConfig["dependencies"]>}
 */
async function getDepConfig() {
	const deps = await readdir(depPath(), { withFileTypes: true });
	/** @type {RootConfig["dependencies"]} */
	const dependencies = {};
	for (let dep of deps) {
		if (dep.isDirectory() && !shouldIgnore(dep.name)) {
			const versions = await readdir(depPath(dep.name), {
				withFileTypes: true,
			});

			/** @type {Record<string, string>} */
			const versionsObj = {};
			for (let version of versions) {
				if (version.isDirectory() && !shouldIgnore(version.name)) {
					versionsObj[version.name] = depPath(dep.name, version.name);
				}
			}

			dependencies[dep.name] = versionsObj;
		}
	}

	return dependencies;
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
