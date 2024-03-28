import path from "node:path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

/** @type {(val: string | string[]) => string[]} */
export const ensureArray = (val) => (Array.isArray(val) ? val : [val]);

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
		url.searchParams.append("dep", makeDepVersion(depName, version));
	}

	return url;
}

/**
 * @typedef {{ baseName: string; implId: string; depGroupId: string; dependencies: DepVersion[]; }} BenchmarkURL
 * @type {(url: string | URL) => BenchmarkURL}
 */
export function parseBenchmarkURL(url) {
	if (typeof url === "string") {
		url = new URL(url);
	}

	const baseName = path.basename(url.pathname).replace(".html", "");
	const impl = url.searchParams.get("impl") ?? "";
	const dependencies = url.searchParams
		.getAll("dep")
		.map((dep) => parseDepVersion(dep));
	const depGroupId = dependencies
		.map(([name, version]) => makeDepVersion(name, version))
		.join(", ");

	return {
		baseName,
		depGroupId,
		dependencies,
		implId: impl,
	};
}

/** @type {(benchmarkFile: string) => string} */
export function getBenchmarkBaseName(benchmarkFile) {
	return path.basename(benchmarkFile).replace(".html", "");
}

export const versionSep = "@";

/** @type {(version: string) => DepVersion} */
export function parseDepVersion(version) {
	const index = version.lastIndexOf(versionSep);
	return [version.slice(0, index), version.slice(index + 1)];
}

/** @type {(name: string, version: string) => string} */
export function makeDepVersion(name, version) {
	return `${name}${versionSep}${version}`;
}

/** @type {(version: string) => string} */
export function makeBenchmarkLabel(version) {
	return version.replace(/ +/g, "\n");
}
