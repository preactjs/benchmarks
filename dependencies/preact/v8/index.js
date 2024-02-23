import { render } from "preact";

// @ts-expect-error Vite handles this correctly, but TS doesn't know
export * from "preact";

/**
 * @param {HTMLElement} rootDom
 * @returns {{ render(vnode: JSX.Element): void; hydrate(vnode: JSX.Element): void; }}
 */
export function createRoot(rootDom) {
	/** @type {Element | undefined} */
	let result;
	return {
		render(vnode) {
			if (result) {
				result = render(vnode, rootDom, result);
			} else {
				result = render(vnode, rootDom);
			}
		},
		hydrate(vnode) {
			render(
				vnode,
				rootDom,
				/** @type {Element} */ (rootDom.firstElementChild),
			);
		},
	};
}
