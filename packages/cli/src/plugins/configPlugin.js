/** @type {(cliConfig: CLIConfig) => import('vite').Plugin} */
export function configPlugin(cliConfig) {
	return {
		name: "preact-benchmark:config",
		transformIndexHtml(html, ctx) {
			return html.replace(/__CONFIG_DATA__/g, JSON.stringify(cliConfig));
		},
	};
}
