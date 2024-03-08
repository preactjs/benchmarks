import { execFile } from "node:child_process";
import { Writable } from "node:stream";

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
export async function execProcess(file, args, options) {
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
		console.error(
			"🚨 Failed to execute last command. Here is the command, stdout, and stderr:",
		);
		console.log(file, args.join(" "));
		console.error(stdout);
		console.error(stderr);
		throw e;
	}

	return stdout;
}
