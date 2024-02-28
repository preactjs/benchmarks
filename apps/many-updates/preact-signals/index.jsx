import { signal, useComputed } from "@preact/signals";
import { createElement, createRoot } from "preact";

const state = {
	msg: signal("hello"),
	list: new Array(1000).fill(0).map((_, i) => ({
		i: signal(i),
		text: signal("foobar" + i),
	})),
};

function scheduleUpdate() {
	state.msg.value = state.msg.value === "hello" ? "bye" : "hello";
	state.list[0].text.value = state.msg.value;
}

/** @param {{ i: number; obj: state["list"][0] }} props */
function Item({ obj, i }) {
	const title = useComputed(() => state.msg.value + i);
	return (
		<div title={title}>
			<span className={state.msg}>{obj.text}</span>
			<span className="baz">one</span>
			<span className="qux">two</span>
			<div>
				<span className="qux">three</span>
				<span className="qux">four</span>
				<span className="baz">five</span>
				<div>
					<span className="qux">six</span>
					<span className="baz">seven</span>
					<span className={state.msg}>eight</span>
				</div>
			</div>
		</div>
	);
}

let counter = 0;
function App() {
	return (
		<div>
			<p>{`> ${++counter} <`}</p>
			<p>{state.msg}</p>
			{state.list.map((obj, i) => (
				<Item key={i} i={i} obj={obj} />
			))}
		</div>
	);
}

/** @type {(rootElement: HTMLElement) => () => void} */
export function mount(rootElement) {
	const root = createRoot(rootElement);
	root.render(<App />);

	return function rerender() {
		scheduleUpdate();
	};
}
