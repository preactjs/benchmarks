import fs, { existsSync } from "fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { appFilePath, depFilePath } from "./utils.js";

/** @type {(name: string) => boolean} */
function shouldIgnore(name) {
	return (
		name === "node_modules" || name.startsWith("_") || name.startsWith(".")
	);
}

/** @type {RootConfig["apps"] | null} */
let appConfigCache = null;

/**
 * Get the list of apps, benchmarks, and implementations available.
 * @type {(useCache?: boolean) => Promise<RootConfig["apps"]>}
 */
export async function getAppConfig(useCache = false) {
	if (useCache && appConfigCache) return appConfigCache;

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

	appConfigCache = apps;
	return apps;
}

/**
 * Find all directories with a `package.json` file in the `searchPath`. Return
 * the paths from the search path to directory.
 * @type {(searchPath: string, depName: string) => Promise<string[]>}
 */
async function findDependencyDirs(searchPath, depName) {
	const depPath = path.join(searchPath, depName);
	const depPkgPath = path.join(depPath, "package.json");

	if (fs.existsSync(depPkgPath)) {
		return [depName];
	}

	const results = [];
	const subPaths = await readdir(depPath, { withFileTypes: true });
	for (let subPath of subPaths) {
		if (subPath.isDirectory() && !shouldIgnore(subPath.name)) {
			const result = await findDependencyDirs(
				searchPath,
				depName + "/" + subPath.name,
			);
			if (result.length) results.push(...result);
		}
	}

	return results;
}

/** @type {RootConfig["dependencies"] | null} */
let depConfigCache = null;

/**
 * Get the list of dependencies and the versions available for each.
 * @type {(useCache?: boolean) => Promise<RootConfig["dependencies"]>}
 */
export async function getDepConfig(useCache = false) {
	if (useCache && depConfigCache) return depConfigCache;

	const searchPaths = await readdir(depFilePath(), { withFileTypes: true });

	/** Directories containing a `package.json` from `depFilePath()`, e.g. preact/latest */
	const deps = (
		await Promise.all(
			searchPaths
				.filter((dep) => dep.isDirectory() && !shouldIgnore(dep.name))
				.map((dep) => findDependencyDirs(depFilePath(), dep.name)),
		)
	).flat();

	/** @type {RootConfig["dependencies"]} */
	const dependencies = {};

	for (let depDir of deps) {
		const index = depDir.lastIndexOf("/");
		const depName = depDir.slice(0, index);
		const version = depDir.slice(index + 1);

		if (!dependencies[depName]) dependencies[depName] = {};

		const scriptsPath = depFilePath(depDir, "scripts.js");
		if (existsSync(scriptsPath)) {
			dependencies[depName][version] = {
				path: depDir,
				scriptsPath,
			};
		} else {
			dependencies[depName][version] = depDir;
		}
	}

	depConfigCache = dependencies;
	return dependencies;
}
