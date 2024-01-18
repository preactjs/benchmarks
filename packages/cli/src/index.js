import { getAppConfig } from "@preact/benchmark-apps";
import { getDepConfig } from "@preact/benchmark-deps";

async function getCLIConfig() {
	return {
		dependencies: {
			...(await getDepConfig()),
		},
		apps: {
			...(await getAppConfig()),
		},
	};
}

export async function runBenchmarks() {
	console.log(await getCLIConfig());
	console.log("Running benchmarks...");
}
