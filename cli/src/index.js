import { createServer } from "vite";
import { rootIndexPlugin } from "./plugins/rootIndexPlugin.js";
import { repoRoot } from "./utils.js";
import { dependencyPlugin } from "./plugins/dependencyPlugin.js";

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

export async function runBenchmarks() {
	console.log("Running benchmarks...");
}
