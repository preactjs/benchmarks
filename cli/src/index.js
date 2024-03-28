import kleur from "kleur";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { createServer } from "vite";
import { dependencyPlugin } from "./plugins/dependencyPlugin.js";
import { rootIndexPlugin } from "./plugins/rootIndexPlugin.js";
import { pinLocalDependencies, prepareDependencies } from "./prepare.js";
import { displayResults } from "./results.js";
import { runTach } from "./tach.js";
import { repoRoot, resultsPath } from "./utils.js";

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

/** @type {(benchmarkFile: string, benchConfig: BenchmarkConfig) => Promise<import("vite").ViteDevServer>} */
export async function runBenchmarksInteractively(benchmarkFile, benchConfig) {
	const server = await runBenchServer(false, false, benchConfig.port);

	const customShortcuts = [
		// Defaults:
		// - press r + enter to restart the server
		// - press u + enter to show server url
		// - press o + enter to open in browser
		// - press c + enter to clear console
		// - press q + enter to quit

		{
			key: "p",
			description: "Pin current local changes into local-pinned",
			async action() {
				console.log("\nPinning local dependencies...");
				await pinLocalDependencies(benchConfig.depGroups.flat());
				console.log();
			},
		},
		{
			key: "b",
			description: "run Benchmarks",
			async action() {
				console.log("\nPreparing dependencies...");
				await prepareDependencies(benchConfig.depGroups.flat());

				// Invalidate the module graph to ensure that the new code in dependencies
				// is picked up
				server.moduleGraph.invalidateAll();

				const results = await runTach(benchmarkFile, benchConfig);

				console.log("\n\n");
				await displayResults(results);
				console.log();
			},
		},
	];

	/** @type {(key: string, description: string) => void} */
	function logShortcut(key, description) {
		server.config.logger.info(
			kleur.dim(kleur.green("  ➜")) +
				kleur.dim("  press ") +
				kleur.bold(key + " + enter") +
				kleur.dim(" " + description),
		);
	}

	server.bindCLIShortcuts({ customShortcuts });
	server.printUrls();

	customShortcuts.forEach((shortcut) => {
		logShortcut(shortcut.key, shortcut.description);
	});
	logShortcut("h", "show help");

	return server;
}

/** @type {(benchmarkFile: string, benchConfig: BenchmarkConfig) => Promise<void>} */
export async function runBenchmarks(benchmarkFile, benchConfig) {
	if (!existsSync(benchmarkFile)) {
		throw new Error(`Benchmark file not found: ${benchmarkFile}`);
	}

	await mkdir(resultsPath(), { recursive: true });

	console.log("Preparing dependencies...");
	await prepareDependencies(benchConfig.depGroups.flat());

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
