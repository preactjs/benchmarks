import { mkdir, readFile } from "node:fs/promises";
import { createServer } from "vite";
import { rootIndexPlugin } from "./plugins/rootIndexPlugin.js";
import { repoRoot, resultsPath } from "./utils.js";
import { dependencyPlugin } from "./plugins/dependencyPlugin.js";
import { runTach } from "./tach.js";
import { displayResults } from "./results.js";

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

	const server = await runBenchServer(false, benchConfig.port);

	try {
		const resultsFile = await runTach(benchmarkFile, benchConfig);
		console.log();

		const results = JSON.parse(await readFile(resultsFile, "utf8"));
		await displayResults(results);
	} finally {
		await server.close();
	}
}
