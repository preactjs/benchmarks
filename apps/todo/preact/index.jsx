import { createRoot, createElement } from "preact";

/**
 * @typedef {{ id: number; text: string; done: boolean; }} TodoItem
 * @typedef {{ counter: number; text: string; todos: TodoItem[]}} State
 * @type {() => State}
 */
const freshState = () => ({ counter: 0, text: "", todos: [] });
let state = freshState();

/** @type {() => void} */
let rerender;

/**
 * @param {(state: State, e: Event) => Partial<State>} fn
 * @returns {(e: Event) => void}
 */
function mutation(fn) {
	return (e) => {
		state = Object.assign({}, state, fn(state, e));
		rerender();
	};
}

const add = mutation(({ counter, text, todos }, e) => {
	e.preventDefault();
	const id = ++counter;
	return { counter, text: "", todos: todos.concat({ text, id, done: false }) };
});

// @ts-expect-error Ignore null checks here
const setText = mutation((state, e) => ({ text: e.target.value }));

const toggle = mutation(({ todos }, e) => {
	// @ts-expect-error Ignore null checks here
	const id = e.currentTarget.getAttribute("data-todo");
	todos = todos.map((todo) =>
		todo.id == id ? { ...todo, done: !todo.done } : todo,
	);
	return { todos };
});

const remove = mutation(({ todos }, e) => {
	// @ts-expect-error Ignore null checks here
	const id = e.currentTarget.getAttribute("data-todo");
	todos = todos.filter((todo) => todo.id != id);
	return { todos };
});

/** @param {{ todo: TodoItem }} props */
function TodoItem({ todo }) {
	return (
		// @ts-expect-error - `done` is not a valid attribute
		<li done={todo.done} data-todo={todo.id} onClick={toggle}>
			<input type="checkbox" checked={todo.done} readonly />
			<p>{todo.text}</p>
			<a data-todo={todo.id} onClick={remove}>
				✕
			</a>
		</li>
	);
}

/** @param {{ text: string; todos: TodoItem[] }} props */
function App({ text, todos }) {
	return (
		<div>
			<form onSubmit={add}>
				<input
					value={text}
					onInput={setText}
					placeholder="Enter a new to-do item..."
				/>
				<button type="submit" disabled={!text}>
					Add
				</button>
			</form>
			<ul>
				{todos.map((todo) => (
					<TodoItem key={todo.id} todo={todo} />
				))}
			</ul>
		</div>
	);
}

/** @type {(rootElement: Element) => { unmount(): void }} */
export function mount(rootElement) {
	const root = createRoot(rootElement);

	state = freshState();
	root.render(<App {...state} />);

	rerender = () => root.render(<App {...state} />);

	return {
		unmount() {
			root.render(null);
		},
	};
}
