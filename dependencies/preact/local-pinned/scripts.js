/// <reference types="node" />

import { existsSync } from "node:fs";
import path from "node:path";
import { execProcess } from "../../utils.js";
import {
	tarballPath as localTarballPath,
	setup as localSetup,
} from "../local/scripts.js";

const __dirname = new URL(".", import.meta.url).pathname;
/** @type {(...args: string[]) => string} */
const pkgRoot = (...args) => path.join(__dirname, ...args);
const pinnedTarballPath = pkgRoot("preact-local-pinned.tgz");

export async function setup() {
	if (!existsSync(pinnedTarballPath)) {
		console.log("Initializing preact-local-pinned.tgz from preact-local...");

		if (!existsSync(localTarballPath)) {
			await localSetup();
		}

		execProcess("mv", [localTarballPath, pinnedTarballPath], {
			cwd: pkgRoot(),
		});
	}

	return () => Promise.resolve();
}
