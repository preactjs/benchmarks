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

/** @type {(rootElement: HTMLElement, initialValue: number) => (randomValue: number) => void} */
export function mount(rootElement, initialValue = -1) {
	compatRender(<Component randomValue={initialValue} />, rootElement);
	return (randomValue) => {
		compatRender(<Component randomValue={randomValue} />, rootElement);
	};
}
