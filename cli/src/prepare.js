import { execFileSync } from "child_process";
import { getDepConfig } from "./config.js";
import { makeDepVersion, repoRoot } from "./utils.js";

/** @type {(dependencies: DepVersion[]) => Promise<() => Promise<void>>} */
export async function prepareDependencies(dependencies) {
	const depConfig = await getDepConfig(true);

	/** @type {Array<() => Promise<void>>} */
	const teardowns = [];
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
			const teardown = await scripts.setup?.();
			if (teardown) teardowns.push(teardown);
		}
	}

	reinstallDependencies();

	return async () => {
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

export async function pinLocalDependencies() {
	// TODO: Implement
	console.log("Pinning local dependencies...");
}

function reinstallDependencies() {
	execFileSync("pnpm", ["install", "--filter", "./dependencies/**"], {
		cwd: repoRoot(),
		stdio: "inherit",
	});
}
