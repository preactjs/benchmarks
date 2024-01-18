import { writeFile } from "node:fs/promises";
import { getAppConfig } from "@preact/benchmark-apps";
import { getDepConfig } from "@preact/benchmark-deps";

async function getDefaultConfig() {
	const apps = await getAppConfig();
	const dependencies = await getDepConfig();
	return { apps, dependencies };
}

export async function runBenchmarks() {
	console.log("Running benchmarks...");
}

/** @type {(config: CLIConfig | Promise<CLIConfig> | (() => CLIConfig | Promise<CLIConfig>)) => Promise<CLIConfig>} */
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
