import fs from "node:fs";
import { readFile } from "node:fs/promises";
import { send } from "vite";
import { URLPattern } from "urlpattern-polyfill";

/**
 * @typedef {(server: import('vite').ViteDevServer, config: Config) => import('vite').Connect.NextHandleFunction} Middleware
 * @template Config
 */

const pattern = new URLPattern({
	pathname: "/:appName?/:benchmarkName?",
});

/** @type {Middleware<RootConfig>} */
const appMiddleware = (server, config) => async (req, res, next) => {
	if (!req.url) return next();

	const fullUrl = new URL(req.url, "http://" + req.headers.host);
	const match = pattern.exec(fullUrl.href);
	const params = match?.pathname.groups ?? {};
	const { appName, benchmarkName } = params;
	const appConfig = appName && config.apps[appName];
	const benchmarkConfig =
		benchmarkName && appConfig && appConfig.benchmarks?.[benchmarkName];

	if (!appConfig || !benchmarkConfig || !fs.existsSync(benchmarkConfig)) {
		return next();
	}

	return send(req, res, await readFile(benchmarkConfig), "html", {
		headers: server.config.server.headers,
	});
};

/** @type {Middleware<RootConfig>} */
const appNotFoundMiddleware = (server, config) => (req, res, next) => {
	/** @type {(text: string) => void} */
	const sendResponse = (missingText) => {
		const body = `<html><body><h1>404 - Not Found</h1><p>${missingText}</p><p>Try navigating <a href="/">back home</a> and trying again.</p></body></html>`;
		res.writeHead(404, {
			...server.config.server.headers,
			"Content-Type": "text/html",
			"Content-Length": Buffer.byteLength(body),
		});
		res.end(body);
	};

	if (!req.url) return next();
	const fullUrl = new URL(req.url, "http://" + req.headers.host);
	const match = pattern.exec(fullUrl.href);
	const params = match?.pathname.groups ?? {};
	const { appName, benchmarkName } = params;
	if (!appName) {
		return sendResponse(
			"App not specified in URL path. Expected path in form of /app/:appName/:benchmarkName"
		);
	}
	if (!benchmarkName) {
		return sendResponse(
			"Benchmark not specified in URL path. Expected path in form of /app/:appName/:benchmarkName"
		);
	}

	const appConfig = appName && config.apps[appName];
	if (!appConfig) {
		return sendResponse(`App not found: ${appName}`);
	}

	const benchmarkConfig =
		benchmarkName && appConfig && appConfig.benchmarks?.[benchmarkName];
	if (!benchmarkConfig) {
		return sendResponse(`Benchmark not found: ${benchmarkName}`);
	}

	if (!fs.existsSync(benchmarkConfig)) {
		return sendResponse(`Benchmark file not found: ${benchmarkConfig}`);
	}

	return sendResponse("Unknown error");
};

/** @type {(config: RootConfig) => import('vite').Plugin} */
export function appPlugin(config) {
	return {
		name: "preact-benchmark:app",
		configureServer(server) {
			server.middlewares.use("/app/", appMiddleware(server, config));
			return () =>
				server.middlewares.use("/app/", appNotFoundMiddleware(server, config));
		},
	};
}
