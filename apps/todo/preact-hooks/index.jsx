import { createElement, render } from "preact";
import { useState } from "preact/hooks";

function App() {
	const [count, setCount] = useState(0);
	return (
		<div>
			Count: {count}{" "}
			<button type="button" onClick={() => setCount(count + 1)}>
				Add one
			</button>
		</div>
	);
}

const root = document.createElement("div");
document.body.appendChild(root);
render(<App />, root);
