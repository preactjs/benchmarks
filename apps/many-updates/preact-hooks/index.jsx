import { createElement, createRoot } from "preact";
import { useState, useCallback } from "preact/hooks";

const initialState = {
	msg: "hello",
	list: new Array(1000).fill(0).map((_, i) => ({
		i,
		text: "foobar" + i,
	})),
};

/** @type {() => void} */
let scheduleUpdate;

let counter = 0;
function App() {
	const [state, setState] = useState(initialState);
	scheduleUpdate = useCallback(() => {
		setState((prev) => {
			const newState = { ...prev };
			newState.msg = newState.msg === "hello" ? "bye" : "hello";
			newState.list[0].text = newState.msg;
			return newState;
		});
	}, []);

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
		scheduleUpdate();
	};
}
