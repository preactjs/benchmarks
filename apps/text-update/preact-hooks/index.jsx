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

/** @type {any} */
let root;

/** @type {(randomValue: number) => void} */
export function render(randomValue) {
	if (!root) {
		root = createRoot(document.getElementById("root"));
	}

	root.render(<Component randomValue={randomValue} />);
}
