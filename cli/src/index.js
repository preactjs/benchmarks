import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";
import { rootIndexPlugin } from "./plugins/rootIndexPlugin.js";
import { repoRoot } from "./utils.js";
import { dependencyPlugin } from "./plugins/dependencyPlugin.js";
// import { generateConfig } from "./tach.js";

const require = createRequire(import.meta.url);

/** @type {() => Promise<void>} */
export async function runDevServer() {
	// TODO: Only in dev mode should we enable HMR. We should disable it when
	// actually running benchmarks.
	const server = await createServer({
		root: repoRoot(),
		configFile: false,
		appType: "mpa",
		esbuild: {
			jsxFactory: "createElement",
			jsxFragment: "Fragment",
		},
		optimizeDeps: { disabled: true },
		plugins: [rootIndexPlugin(), dependencyPlugin()],
	});
	await server.listen();

	server.printUrls();
	server.bindCLIShortcuts({ print: true });
}

/** @type {(benchmarkFile: string, options: BenchmarkActionConfig) => Promise<void>} */
export async function runBenchmarks(benchmarkFile, options) {
	console.log("Running benchmarks...");

	// /** @type {(...args: string[]) => string} */
	// const benchesRoot = (...args) => path.join(process.cwd(), ...args);
	// /** @type {(...args: string[]) => string} */
	// const resultsPath = (...args) => benchesRoot("results", ...args);
	//
	// await mkdir(resultsPath(), { recursive: true });
	// const { name, configPath } = await generateConfig(benchmarkFile, options);
	//
	// const args = [
	// 	require.resolve("tachometer/bin/tach.js"),
	// 	"--force-clean-npm-install",
	// 	"--config",
	// 	configPath,
	// 	"--json-file",
	// 	resultsPath(name + ".json"),
	// ];
	//
	// console.log("\n$", process.execPath, ...args);
	//
	// spawnSync(process.execPath, args, {
	// 	cwd: benchesRoot(),
	// 	stdio: "inherit",
	// });
}
