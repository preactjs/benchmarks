import path from "node:path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

/** @type {(...args: string[]) => string} */
export const repoRoot = (...args) => path.join(__dirname, "../..", ...args);

/** @type {(...args: string[]) => string} */
export const appFilePath = (...args) => repoRoot("apps", ...args);
/** @type {(...args: string[]) => string} */
export const depFilePath = (...args) => repoRoot("dependencies", ...args);

/** @type {(...args: string[]) => string} */
export const configDir = (...args) => repoRoot("out", "configs", ...args);

/** @type {(...args: string[]) => string} */
export const baseTraceLogDir = (...args) => repoRoot("out", "logs", ...args);

/** @type {(...args: string[]) => string} */
export const resultsPath = (...args) => repoRoot("out", "results", ...args);

/** @type {(...args: string[]) => string} */
export const appUrl = (...args) =>
	path.posix.join(
		toURLPath(appFilePath(...args)),
		...args.map(encodeURIComponent),
	);

/** @type {(...args: string[]) => string} */
export const depUrl = (...args) =>
	path.posix.join(
		toURLPath(depFilePath(...args)),
		...args.map(encodeURIComponent),
	);

/** @type {(filePath: string) => string} */
export function toURLPath(filePath) {
	if (path.isAbsolute(filePath)) {
		if (!filePath.startsWith(repoRoot())) {
			throw new Error(`Cannot convert absolute path to URL path: ${filePath}`);
		}

		filePath = filePath.replace(repoRoot(), "");
	}

	return new URL(filePath.replace(/\\/g, "/"), "http://localhost/").pathname;
}

/**
 * @param {URL} baseURL
 * @param {string} benchmarkFile
 * @param {DependencyGroup} dependencies
 * @param {string} impl
 * @returns {URL}
 */
export function getBenchmarkURL(baseURL, benchmarkFile, dependencies, impl) {
	const url = new URL(toURLPath(benchmarkFile), baseURL);
	url.searchParams.set("impl", impl);

	for (let [depName, version] of dependencies) {
		url.searchParams.append(`dep:${depName}`, version);
	}

	return url;
}

/** @type {(benchmarkFile: string) => string} */
export function getBenchmarkBaseName(benchmarkFile) {
	return path.basename(benchmarkFile).replace(".html", "");
}

/**
 * @typedef {{ fullName: string; baseName: string;  implId: string; depGroupId: string; dependencies: DependencyGroup; }} BenchmarkId
 * @type {(baseName: string, dependencies: DependencyGroup, implId: string) => BenchmarkId}
 */
export function getBenchmarkId(baseName, dependencies, impl) {
	const depGroupId = dependencies
		.map(([name, version]) => `${name}@${version}`)
		.join(", ");

	return {
		fullName: `${baseName} (${impl}) (${depGroupId})`,
		baseName,
		depGroupId,
		dependencies,
		implId: impl,
	};
}

/** @type {(benchId: string) => BenchmarkId} */
export function parseBenchmarkId(benchId) {
	const match = benchId.match(/^(.*) \((.*)\) \((.*)\)$/);
	if (!match) {
		throw new Error(`Invalid benchmark ID: ${benchId}`);
	}

	const [, baseName, implId, depGroupId] = match;
	return {
		fullName: benchId,
		baseName,
		implId,
		depGroupId,
		dependencies: depGroupId.split(", ").map((dep) => {
			const [name, version] = dep.split("@");
			return [name, version];
		}),
	};
}
