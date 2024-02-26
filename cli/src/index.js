import { mkdir, readFile } from "node:fs/promises";
import { createServer } from "vite";
import { rootIndexPlugin } from "./plugins/rootIndexPlugin.js";
import { repoRoot, resultsPath } from "./utils.js";
import { dependencyPlugin } from "./plugins/dependencyPlugin.js";
import { runTach } from "./tach.js";
import { displayResults } from "./results.js";

/** @type {(dev?: boolean, hmr?: boolean, port?: number) => Promise<import("vite").ViteDevServer>} */
export async function runBenchServer(dev = false, hmr = false, port) {
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

	if (dev) {
		server.printUrls();
		server.bindCLIShortcuts({ print: true });
	}

	return server;
}

/** @type {(benchmarkFile: string, benchConfig: BenchmarkConfig) => Promise<void>} */
export async function runBenchmarks(benchmarkFile, benchConfig) {
	await mkdir(resultsPath(), { recursive: true });

	const server = await runBenchServer(false, false, benchConfig.port);

	let results;
	try {
		results = await runTach(benchmarkFile, benchConfig);
	} finally {
		await server.close();
	}

	console.log("\n\n");
	await displayResults(results);
}
