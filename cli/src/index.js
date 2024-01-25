import { writeFile } from "node:fs/promises";
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

/** @type {(config: RootConfig | Promise<RootConfig> | (() => RootConfig | Promise<RootConfig>)) => Promise<RootConfig>} */
export async function defineConfig(config) {
	return typeof config === "function" ? config() : config;
}

/** @type {(configPath: string, localConfig: LocalDependenciesConfig) => Promise<void>} */
export async function initConfig(configPath, localConfig) {
	const localConfigSrc = JSON.stringify(localConfig, null, 2);

	const src = `import { getAppConfig } from "@preact/benchmark-apps";
import { defineConfig } from "@preact/benchmark-cli";
import { getDepConfig } from "@preact/benchmark-deps";

export default defineConfig(async () => {
	const apps = await getAppConfig();
	const dependencies = await getDepConfig(${localConfigSrc});
	return { apps, dependencies };
});
`;

	await writeFile(configPath, src, "utf8");
}
