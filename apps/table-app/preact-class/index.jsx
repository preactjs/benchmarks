import { Main } from "./components.jsx";
import { createRoot, createElement } from "preact";

/**
 * @param {HTMLElement} rootDom
 */
export function render(rootDom) {
	createRoot(rootDom).render(createElement(Main));

	/** @type {Main} */
	// @ts-ignore
	const app = window.app;
	return {
		run: app.run.bind(app),
		add: app.add.bind(app),
		update: app.update.bind(app),
		select: app.select.bind(app),
		delete: app.delete.bind(app),
		runLots: app.runLots.bind(app),
		clear: app.clear.bind(app),
		swapRows: app.swapRows.bind(app),
	};
}
