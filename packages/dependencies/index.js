import { fileURLToPath } from "node:url";

/** @type {(path: string) => string} */
const r = (path) => fileURLToPath(import.meta.resolve(path));

/**
 * @param {LocalDependenciesConfig} [localConfig]
 * @returns {Promise<RootConfig["dependencies"]>}
 */
export async function getDepConfig(localConfig) {
	// TODO: Use importmaps to override dependencies specified in request.
	return {
		preact: {
			local: r("./preact/local"),
			"latest-major": r("./preact/latest-major"),
		},
	};
}
