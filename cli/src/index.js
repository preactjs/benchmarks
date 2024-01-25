import { createServer } from "vite";
import { rootIndexPlugin } from "./plugins/rootIndexPlugin.js";
import { repoRoot } from "./utils.js";

/** @type {() => Promise<void>} */
export async function runDevServer() {
	const server = await createServer({
		root: repoRoot(),
		configFile: false,
		appType: "mpa",
		plugins: [rootIndexPlugin()],
	});
	await server.listen();

	server.printUrls();
	server.bindCLIShortcuts({ print: true });
}

export async function runBenchmarks() {
	console.log("Running benchmarks...");
}
