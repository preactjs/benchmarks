import { createElement, createRoot } from "preact";
import { signal } from "@preact/signals";

const randomValue = signal(-1);

function Component() {
	return (
		<div>
			<h2>Test {randomValue}</h2>
			<h1>==={randomValue}===</h1>
		</div>
	);
}

/** @type {(rootElement: HTMLElement, initialValue: number) => (randomValue: number) => void} */
export function mount(rootElement, initialValue = -1) {
	randomValue.value = initialValue;

	let root = createRoot(rootElement);
	root.render(<Component />);

	return (newRandomValue) => {
		randomValue.value = newRandomValue;
	};
}
