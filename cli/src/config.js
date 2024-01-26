import { readdir } from "node:fs/promises";
import { appFilePath, depFilePath } from "./utils.js";

/** @type {(name: string) => boolean} */
function shouldIgnore(name) {
	return (
		name === "node_modules" || name.startsWith("_") || name.startsWith(".")
	);
}

/**
 * Get the list of apps, benchmarks, and implementations available.
 * @type {() => Promise<RootConfig["apps"]>}
 */
export async function getAppConfig() {
	const appNames = (await readdir(appFilePath(), { withFileTypes: true }))
		.filter((e) => e.isDirectory() && !shouldIgnore(e.name))
		.map((e) => e.name);

	/** @type {RootConfig["apps"]} */
	const apps = {};
	for (let appName of appNames) {
		const appContents = await readdir(appFilePath(appName), {
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
				benchmarks[dirEntry.name] = appFilePath(appName, dirEntry.name);
			}

			if (dirEntry.isDirectory() && !shouldIgnore(dirEntry.name)) {
				implementations[dirEntry.name] = appFilePath(appName, dirEntry.name);
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
 * Get the list of dependencies and the versions available for each.
 * @returns {Promise<RootConfig["dependencies"]>}
 */
export async function getDepConfig() {
	const deps = await readdir(depFilePath(), { withFileTypes: true });
	/** @type {RootConfig["dependencies"]} */
	const dependencies = {};
	for (let dep of deps) {
		if (dep.isDirectory() && !shouldIgnore(dep.name)) {
			const versions = await readdir(depFilePath(dep.name), {
				withFileTypes: true,
			});

			/** @type {Record<string, string>} */
			const versionsObj = {};
			for (let version of versions) {
				if (version.isDirectory() && !shouldIgnore(version.name)) {
					versionsObj[version.name] = depFilePath(dep.name, version.name);
				}
			}

			dependencies[dep.name] = versionsObj;
		}
	}

	return dependencies;
}