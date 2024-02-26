import { createElement, render as compatRender } from "preact/compat";

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
		root = document.getElementById("root");
	}

	compatRender(<Component randomValue={randomValue} />, root);
}
