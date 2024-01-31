import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { createServer } from "vite";
import { rootIndexPlugin } from "./plugins/rootIndexPlugin.js";
import { repoRoot, resultsPath } from "./utils.js";
import { dependencyPlugin } from "./plugins/dependencyPlugin.js";
import { generateTachConfig } from "./tach.js";
import { displayResults } from "./results.js";

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

/** @type {(dev?: boolean, port?: number) => Promise<import("vite").ViteDevServer>} */
export async function runBenchServer(dev = false, port) {
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
		server: { port, hmr: dev },
		plugins: [rootIndexPlugin(), dependencyPlugin()],
	});

	await server.listen();

	if (dev) {
		server.printUrls();
		server.bindCLIShortcuts({ print: true });
	}

	return server;
}

/** @type {(benchmarkFile: string, benchConfig: BenchmarkConfig) => Promise<void>} */
export async function runBenchmarks(benchmarkFile, benchConfig) {
	await mkdir(resultsPath(), { recursive: true });
	const { name, configPath } = await generateTachConfig(
		benchmarkFile,
		benchConfig
	);

	const server = await runBenchServer(false, benchConfig.port);

	const resultsFile = resultsPath(name + ".json");
	const tachArgs = [
		require.resolve("tachometer/bin/tach.js"),
		"--config",
		configPath,
		"--json-file",
		resultsFile,
	];

	if (benchConfig.debug) {
		console.log("\n$", process.execPath, ...tachArgs);
	}

	try {
		await waitForExit(
			spawn(process.execPath, tachArgs, {
				cwd: repoRoot(),
				stdio: "inherit",
			}),
		);

		const results = JSON.parse(await readFile(resultsFile, "utf8"));
		await displayResults(results);
	} finally {
		await server.close();
	}
}
