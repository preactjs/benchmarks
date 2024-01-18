import { fileURLToPath } from "node:url";

/** @type {(path: string) => string} */
const r = (path) => fileURLToPath(import.meta.resolve(path));

/**  @type {() => Promise<CLIConfig["dependencies"]>} */
export async function getDepConfig() {
	return {
		preact: {
			local: r("./preact/local"),
			"latest-major": r("./preact/latest-major"),
		},
	};
}
