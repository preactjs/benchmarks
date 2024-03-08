/// <reference types="node" />

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { execProcess } from "../../utils.js";

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

const __dirname = new URL(".", import.meta.url).pathname;
/** @type {(...args: string[]) => string} */
const pkgRoot = (...args) => path.join(__dirname, ...args);

export const tarballPath = pkgRoot("preact-local.tgz");

export async function setup() {
	const [preactRepoRoot, preactLocalTarballPath] = await Promise.all([
		getPreactRepoRoot(),
		getPreactLocalTarballPath(),
	]);

	if (!preactRepoRoot && !preactLocalTarballPath) {
		throw new Error("Preact repo or local tarball not found");
	}

	if (preactRepoRoot) {
		console.log("Building preact...");
		const options = { cwd: preactRepoRoot };
		await execProcess(npmCmd, ["run", "build"], options);
		const tarballName = await execProcess(npmCmd, ["pack"], options);

		await execProcess(
			"mv",
			[tarballName.trim(), pkgRoot("preact-local.tgz")],
			options,
		);

		// Verify that the tarball was created and moved correctly
		if (!getPreactLocalTarballPath()) {
			throw new Error("Preact tarball not found after building");
		}
	}

	return () => Promise.resolve();
}

export async function pin() {
	await setup();

	const preactLocalTarballPath = getPreactLocalTarballPath();
	if (!preactLocalTarballPath) throw new Error("Preact tarball not found");

	execProcess(
		"mv",
		[
			preactLocalTarballPath,
			pkgRoot("../local-pinned/preact-local-pinned.tgz"),
		],
		{ cwd: pkgRoot() },
	);
	console.log("preact-local.tgz -> ../local-pinned/preact-local-pinned.tgz");
}

async function getPreactRepoRoot() {
	const preactRepoRoot = pkgRoot("../../../../");
	const preactRepoPkg = path.join(preactRepoRoot, "package.json");
	if (!existsSync(preactRepoPkg)) {
		return null;
	}

	// Check if this is the preact repo and return the path if so
	const pkg = JSON.parse(await readFile(preactRepoPkg, "utf-8"));
	return pkg.name === "preact" ? preactRepoRoot : null;
}

function getPreactLocalTarballPath() {
	return existsSync(tarballPath) ? tarballPath : null;
}
