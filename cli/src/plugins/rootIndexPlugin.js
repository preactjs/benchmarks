import { getAppConfig } from "@preact/benchmark-apps";
import { getDepConfig } from "@preact/benchmark-deps";

/** @type {() => import('vite').Plugin} */
export function rootIndexPlugin() {
	return {
		name: "preact-benchmark:config",
		async transformIndexHtml(html, ctx) {
			if (ctx.path !== "/" && ctx.path !== "/index.html") return;

			const apps = await getAppConfig();
			const dependencies = await getDepConfig();
			/** @type {RootConfig} */
			const config = { apps, dependencies };

			return html.replace(/__CONFIG_DATA__/g, JSON.stringify(config));
		},
	};
}
