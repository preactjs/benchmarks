import { createRoot, createElement } from "preact";

/** @param {{ children: any }} props */
function Row(props) {
	return <article>{props.children}</article>;
}

/** @param {{ items: number[] }} props */
function App(props) {
	return (
		<div>
			<div class="items">
				{props.items.map((id) => (
					<Row key={id}>{id}</Row>
				))}
			</div>
		</div>
	);
}

/** @type {(rootElement: HTMLElement) => () => void} */
export function mount(rootElement) {
	const count = 1000;
	const start = 20;
	const end = 600;

	const newItems = () =>
		Array(count)
			.fill(0)
			.map((item, i) => i);
	let items = newItems();
	let currentItems = items;

	const root = createRoot(rootElement);
	root.render(<App items={items} />);

	return function rerender() {
		items = newItems().filter((id) => {
			const isVisible = currentItems.includes(id);
			return id >= start && id <= end ? !isVisible : isVisible;
		});
		currentItems = items;

		root.render(<App items={items} />);
	};
}
