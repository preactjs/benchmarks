import fs from "fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
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
	const searchPaths = await readdir(depFilePath(), { withFileTypes: true });
	const deps = (
		await Promise.all(
			searchPaths
				.filter((dep) => dep.isDirectory())
				.map((dep) => findDependencyDirs(depFilePath(), dep.name)),
		)
	).flat();

	/** @type {RootConfig["dependencies"]} */
	const dependencies = {};

	for (let depDir of deps) {
		const parts = depDir.replace(depFilePath() + "/", "").split(path.sep);
		const version = parts.pop() ?? "";
		const depName = parts.join("/");

		if (!dependencies[depName]) dependencies[depName] = {};
		dependencies[depName][version] = depDir;
	}

	return dependencies;
}

/** @type {(searchPath: string, depName: string) => Promise<string[]>} */
async function findDependencyDirs(searchPath, depName) {
	const depPath = path.join(searchPath, depName);
	const depPkgPath = path.join(depPath, "package.json");

	if (fs.existsSync(depPkgPath)) {
		return [depPath];
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
