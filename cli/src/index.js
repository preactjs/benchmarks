import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { createServer } from "vite";
import { rootIndexPlugin } from "./plugins/rootIndexPlugin.js";
import { repoRoot, resultsPath } from "./utils.js";
import { dependencyPlugin } from "./plugins/dependencyPlugin.js";
import { generateConfig } from "./tach.js";

const require = createRequire(import.meta.url);

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

/** @type {(opts?: {hmr?: boolean; port?: number;}) => Promise<import("vite").ViteDevServer>} */
export async function runBenchServer({
	hmr = undefined,
	port = undefined,
} = {}) {
	// TODO: Consider how in dev mode how to handle preparing dependencies...
	const server = await createServer({
		root: repoRoot(),
		configFile: false,
		appType: "mpa",
		esbuild: {
			jsxFactory: "createElement",
			jsxFragment: "Fragment",
		},
		optimizeDeps: { disabled: true },
		server: { port, hmr },
		plugins: [rootIndexPlugin(), dependencyPlugin()],
	});

	await server.listen();

	server.printUrls();
	server.bindCLIShortcuts({ print: true });

	return server;
}

/** @type {(benchmarkFile: string, options: BenchmarkActionConfig) => Promise<void>} */
export async function runBenchmarks(benchmarkFile, options) {
	await mkdir(resultsPath(), { recursive: true });
	const { name, configPath } = await generateConfig(benchmarkFile, options);

	const server = await runBenchServer({ hmr: false, port: options.port });

	const tachArgs = [
		require.resolve("tachometer/bin/tach.js"),
		"--config",
		configPath,
		"--json-file",
		resultsPath(name + ".json"),
	];

	console.log("\n$", process.execPath, ...tachArgs);

	try {
		await waitForExit(
			spawn(process.execPath, tachArgs, {
				cwd: repoRoot(),
				stdio: "inherit",
			}),
		);
	} finally {
		await server.close();
	}
}
