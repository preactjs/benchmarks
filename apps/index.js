import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

/** @type {(path: string) => string} */
const r = (path) => fileURLToPath(import.meta.resolve(path));

/** @type {() => Promise<RootConfig["apps"]>} */
export async function getAppConfig() {
	const appNames = (await readdir(r("."), { withFileTypes: true }))
		.filter(
			(e) =>
				e.isDirectory() && !e.name.startsWith("_") && e.name !== "node_modules"
		)
		.map((e) => e.name);

	/** @type {RootConfig["apps"]} */
	const apps = {};
	for (let appName of appNames) {
		const appContents = await readdir(r(`./${appName}/`), {
			withFileTypes: true,
		});

		/** @type {Record<string, string>} */
		const benchmarks = {};
		/** @type {Record<string, string>} */
		const implementations = {};
		for (let dirEntry of appContents) {
			if (dirEntry.isFile() && dirEntry.name.endsWith(".html")) {
				benchmarks[dirEntry.name] = `./${appName}/${dirEntry.name}`;
			}

			if (dirEntry.isDirectory() && !dirEntry.name.startsWith("_")) {
				implementations[dirEntry.name] = `./${appName}/${dirEntry.name}`;
			}
		}

		apps[appName] = {
			benchmarks,
			implementations,
		};
	}

	return apps;
}
