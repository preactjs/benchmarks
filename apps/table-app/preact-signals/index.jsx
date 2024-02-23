import { createElement, render } from "preact";
import { signal } from "@preact/signals";

const count = signal(0);

function App() {
	return (
		<div>
			Count: {count}{" "}
			<button
				type="button"
				onClick={() => {
					count.value++;
				}}
			>
				Add one
			</button>
		</div>
	);
}

const root = document.createElement("div");
document.body.appendChild(root);
render(<App />, root);
