import { render, hydrate } from "preact-latest";

export * from "preact-latest";

/**
 * @param {HTMLElement} rootDom
 * @returns {{ render(vnode: JSX.Element): void; hydrate(vnode: JSX.Element): void; }}
 */
export function createRoot(rootDom) {
	return {
		render(vnode) {
			render(vnode, rootDom);
		},
		hydrate(vnode) {
			hydrate(vnode, rootDom);
		},
	};
}
