/// <reference types="node" />

import { existsSync } from "node:fs";
import path from "node:path";

const __dirname = new URL(".", import.meta.url).pathname;
/** @type {(...args: string[]) => string} */
const pkgRoot = (...args) => path.join(__dirname, ...args);

export async function setup() {
	const tarballPath = pkgRoot("preact-main.tgz");
	if (!existsSync(tarballPath)) {
		throw new Error(
			"preact-main.tgz tarball not found when setting up preact@main dependency",
		);
	}

	return () => Promise.resolve();
}
