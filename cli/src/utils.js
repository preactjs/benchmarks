import path from "node:path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

/** @type {(...args: string[]) => string} */
export const repoRoot = (...args) => path.join(__dirname, "../..", ...args);

/** @type {(...args: string[]) => string} */
export const appFilePath = (...args) => repoRoot("apps", ...args);
/** @type {(...args: string[]) => string} */
export const depFilePath = (...args) => repoRoot("dependencies", ...args);

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

	return new URL(filePath.replace(/\\/g, "/"), "https://localhost/").pathname;
}
