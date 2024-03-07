import {
	render as preactRender,
	hydrate as preactHydrate,
	createElement,
} from "preact";
import { Store } from "../_shared/store.js";

/** @typedef {import('../_shared/store.js').RowProps} RowProps */
/** @typedef {import('../_shared/store.js').MainProps} MainProps */
/** @typedef {import("../_shared/store").TableApp} TableApp */

/** @param {RowProps} props */
function Row(props) {
	// TODO: Memoize??

	let { styleClass, data, onClick, onDelete } = props;

	return (
		<tr className={styleClass}>
			<td className="col-md-1">{data.id}</td>
			<td className="col-md-4">
				<a onClick={() => onClick(data.id)}>{data.label}</a>
			</td>
			<td className="col-md-1">
				<a onClick={() => onDelete(data.id)}>
					<span className="glyphicon glyphicon-remove" aria-hidden="true" />
				</a>
			</td>
			<td className="col-md-6" />
		</tr>
	);
}

/** @param {MainProps & { select(id: number): void; delete(id: number): void; }} props */
function Main(props) {
	let rows = props.store.data.map((d, i) => {
		return (
			<Row
				key={d.id}
				data={d}
				onClick={props.select}
				onDelete={props.delete}
				styleClass={d.id === props.store.selected ? "danger" : ""}
			/>
		);
	});

	return (
		<div className="container">
			<table className="table table-hover table-striped test-data">
				<tbody>{rows}</tbody>
			</table>
			<span
				className="preloadicon glyphicon glyphicon-remove"
				aria-hidden="true"
			/>
		</div>
	);
}

/** @type {(store: Store, rootDom: HTMLElement) => TableApp} */
function createTableApp(store, rootDom) {
	/** @type {() => void} */
	let rerender;

	const app = {
		run() {
			store.run();
			rerender();
		},
		add() {
			store.add();
			rerender();
		},
		update() {
			store.update();
			rerender();
		},
		/** @param {number} id */
		select(id) {
			store.select(id);
			rerender();
		},
		/** @param {number} id */
		delete(id) {
			store.delete(id);
			rerender();
		},
		runLots() {
			store.runLots();
			rerender();
		},
		clear() {
			store.clear();
			rerender();
		},
		swapRows() {
			store.swapRows();
			rerender();
		},
	};

	rerender = () =>
		preactRender(
			<Main store={store} select={app.select} delete={app.delete} />,
			rootDom,
		);
	return app;
}

/** @type {(rootDom: HTMLElement, props?: MainProps ) => TableApp} */
export function render(rootDom, props) {
	const store = props?.store ?? new Store();
	const app = createTableApp(store, rootDom);
	preactRender(
		<Main store={store} select={app.select} delete={app.delete} />,
		rootDom,
	);
	return app;
}

/** @type {(rootDom: HTMLElement, props?: MainProps ) => TableApp} */
export function hydrate(rootDom, props) {
	const store = props?.store ?? new Store();
	const app = createTableApp(store, rootDom);
	preactHydrate(
		<Main store={store} select={app.select} delete={app.delete} />,
		rootDom,
	);
	return app;
}
