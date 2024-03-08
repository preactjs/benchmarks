import { execFileSync } from "child_process";
import { getDepConfig } from "./config.js";
import { makeDepVersion, repoRoot } from "./utils.js";

/** @type {(dependencies: DepVersion[]) => Promise<() => Promise<void>>} */
export async function prepareDependencies(dependencies) {
	const depConfig = await getDepConfig(true);

	/** @type {Array<() => Promise<() => Promise<void>>>} */
	const setups = [];
	for (let [name, version] of dependencies) {
		if (!name) continue;

		const depPaths = depConfig?.[name]?.[version];
		if (!depPaths) {
			throw new Error(
				`Could not setup dependency ${makeDepVersion(name, version)}`,
			);
		}

		if (typeof depPaths === "string") {
			continue;
		}

		const scriptsPath = depPaths.scriptsPath;
		if (scriptsPath) {
			/** @type {DependencyScripts} */
			const scripts = await import(scriptsPath);
			if (scripts.setup) {
				setups.push(scripts.setup);
			}
		}
	}

	const teardowns = await Promise.all(setups.map((setup) => setup()));

	reinstallDependencies();

	return async () => {
		if (teardowns.length === 0) return;

		const results = await Promise.allSettled(
			teardowns.map((teardown) => teardown()),
		);

		const errors = /** @type {PromiseRejectedResult[]} */ (
			results.filter((result) => result.status === "rejected")
		);
		if (errors.length === 0) {
			return;
		} else if (errors.length === 1) {
			throw errors[0].reason;
		} else {
			throw new AggregateError(
				errors.map((error) => error.reason),
				"Multiple errors occurred",
			);
		}
	};
}

/** @type {(dependencies: DepVersion[]) => Promise<void>} */
export async function pinLocalDependencies(dependencies) {
	const depConfig = await getDepConfig(true);
	for (let [name, version] of dependencies) {
		const localDepConfig = depConfig[name]?.[version];
		if (typeof localDepConfig === "string") {
			continue;
		}

		const scriptsPath = localDepConfig.scriptsPath;
		if (scriptsPath) {
			/** @type {DependencyScripts} */
			const scripts = await import(scriptsPath);
			if (scripts.pin) {
				await scripts.pin();
			}
		}
	}
}

function reinstallDependencies() {
	execFileSync("pnpm", ["install", "--filter", "./dependencies/**"], {
		cwd: repoRoot(),
		stdio: "inherit",
	});
}
