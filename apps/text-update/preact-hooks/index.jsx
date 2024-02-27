import { createElement, createRoot } from "preact";
import "preact/hooks";

/** @param {{ randomValue: number }} props */
function Component({ randomValue }) {
	return (
		<div>
			<h2>Test {randomValue}</h2>
			<h1>==={randomValue}===</h1>
		</div>
	);
}

/** @type {(rootElement: HTMLElement, initialValue: number) => (randomValue: number) => void} */
export function mount(rootElement, initialValue = -1) {
	let root = createRoot(rootElement);
	root.render(<Component randomValue={initialValue} />);

	return (randomValue) => {
		root.render(<Component randomValue={randomValue} />);
	};
}
