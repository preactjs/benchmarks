import { createElement, createRoot } from "preact";

const state = {
	msg: "hello",
	list: new Array(1000).fill(0).map((_, i) => ({
		i,
		text: "foobar" + i,
	})),
};

let counter = 0;
function App() {
	return (
		<div>
			<p>{`> ${++counter} <`}</p>
			<p>{state.msg}</p>
			{state.list.map((obj, i) => (
				<div key={i} title={state.msg + i}>
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
			))}
		</div>
	);
}

/** @type {(rootElement: HTMLElement) => () => void} */
export function mount(rootElement) {
	const root = createRoot(rootElement);
	root.render(<App />);

	return function rerender() {
		state.msg = state.msg === "hello" ? "bye" : "hello";
		state.list[0].text = state.msg;
		root.render(<App />);
	};
}
