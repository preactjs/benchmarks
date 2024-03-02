/// <reference types="node" />

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Writable } from "node:stream";

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

const __dirname = new URL(".", import.meta.url).pathname;
/** @type {(...args: string[]) => string} */
const pkgRoot = (...args) => path.join(__dirname, ...args);

/**
 * @param {import('child_process').ChildProcess} childProcess
 * @returns {Promise<void>}
 */
async function waitForExit(childProcess) {
	return new Promise((resolve, reject) => {
		childProcess.once("exit", (code, signal) => {
			if (code === 0 || signal == "SIGINT") {
				resolve();
			} else {
				reject(new Error("Exit with error code: " + code));
			}
		});

		childProcess.once("error", (err) => {
			reject(err);
		});
	});
}

/**
 * @param {string} file
 * @param {readonly string[]} args
 * @param {import('node:child_process').ExecFileOptions} [options]
 * @returns {Promise<string>}
 */
async function execProcess(file, args, options) {
	const childProcess = execFile(file, args, { ...options, encoding: "utf8" });
	let stdout = "";
	let stderr = "";

	childProcess.stdout?.pipe(
		new Writable({
			write(chunk, encoding, cb) {
				stdout += chunk.toString("utf8");
				cb(null);
			},
		}),
	);
	childProcess.stderr?.pipe(
		new Writable({
			write(chunk, encoding, cb) {
				stderr += chunk.toString("utf8");
				cb(null);
			},
		}),
	);

	try {
		await waitForExit(childProcess);
	} catch (e) {
		console.error();
		console.error("🚨 Failed to build preact. Here is the stdout and stderr:");
		console.error(stdout);
		console.error(stderr);
		throw e;
	}

	return stdout;
}

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
		await getPreactLocalTarballPath();
	}

	return () => Promise.resolve();
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
	const tarballPath = pkgRoot("preact-local.tgz");
	return existsSync(tarballPath) ? tarballPath : null;
}
