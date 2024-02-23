import { getAppConfig, getDepConfig } from "../config.js";

/**
 * Plugin to inject into the root index.html file the list of apps, benchmarks,
 * implementations and dependencies that can be configured to run a benchmark.
 * @type {() => import('vite').Plugin}
 */
export function rootIndexPlugin() {
	return {
		name: "preact-benchmark:config",
		async transformIndexHtml(html, ctx) {
			if (ctx.path !== "/" && ctx.path !== "/index.html") return;

			/** @type {RootConfig} */
			const config = {
				apps: await getAppConfig(),
				dependencies: await getDepConfig(),
			};

			return html.replace(/__CONFIG_DATA__/g, JSON.stringify(config));
		},
	};
}
