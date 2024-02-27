import { ComponentChildren } from "preact";

declare module "preact" {
	export function createRoot(rootElement: Node): {
		render(vnode: ComponentChildren): void;
		hydrate(vnode: ComponentChildren): void;
	};
}
