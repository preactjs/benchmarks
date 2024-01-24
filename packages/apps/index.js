import { fileURLToPath } from "node:url";

/** @type {(path: string) => string} */
const r = (path) => fileURLToPath(import.meta.resolve(path));

/** @type {() => Promise<RootConfig["apps"]>} */
export async function getAppConfig() {
	return {
		"table-app": {
			benchmarks: {
				replace1k: r("./table-app/replace1k.html"),
				hydrate1k: r("./table-app/hydrate1k.html"),
			},
			implementations: {
				"preact-class": r("./table-app/preact-class/index.js"),
				"preact-hooks": r("./table-app/preact-hooks/index.js"),
			},
		},
		todo: {
			benchmarks: {
				todo: r("./todo/todo.html"),
			},
			implementations: {
				"preact-class": r("./todo/preact-class/index.js"),
				"preact-hooks": r("./todo/preact-hooks/index.js"),
			},
		},
	};
}
