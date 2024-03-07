import {
	createElement,
	render as preactRender,
	hydrate as preactHydrate,
} from "preact";
import { useState, useCallback, useRef, useMemo } from "preact/hooks";
import { Store } from "../_shared/store";

/** @typedef {import("../_shared/store").TableApp} TableApp */
/** @typedef {import('../_shared/store.js').Data} Data */
/** @typedef {import('../_shared/store.js').RowProps} RowProps */
/** @typedef {import('../_shared/store.js').MainProps} MainProps */

/** @param {RowProps} props */
function Row({ styleClass, onClick, onDelete, data }) {
	// TODO: Memoize on styleClass and data

	const localOnClick = useCallback(() => onClick(data.id), [onClick, data.id]);
	const localOnDelete = useCallback(
		() => onDelete(data.id),
		[onDelete, data.id],
	);

	return (
		<tr className={styleClass}>
			<td className="col-md-1">{data.id}</td>
			<td className="col-md-4">
				<a onClick={localOnClick}>{data.label}</a>
			</td>
			<td className="col-md-1">
				<a onClick={localOnDelete}>
					<span className="glyphicon glyphicon-remove" aria-hidden="true" />
				</a>
			</td>
			<td className="col-md-6" />
		</tr>
	);
}

/** @type {import('../_shared/store.js').TableApp} */
let app;

/** @param {MainProps} props */
function Main({ store: initialStore }) {
	const [, setState] = useState({});
	const forceUpdate = useCallback(() => setState({}), []);

	/** @type {preact.RefObject<Store | undefined>} */
	const storeRef = useRef();
	if (storeRef.current == null) {
		storeRef.current = initialStore;
	}

	const store = storeRef.current;

	app = useMemo(() => {
		return {
			run() {
				store.run();
				forceUpdate();
			},
			add() {
				store.add();
				forceUpdate();
			},
			update() {
				store.update();
				forceUpdate();
			},
			select(id) {
				store.select(id);
				forceUpdate();
			},
			delete(id) {
				store.delete(id);
				forceUpdate();
			},
			runLots() {
				store.runLots();
				forceUpdate();
			},
			clear() {
				store.clear();
				forceUpdate();
			},
			swapRows() {
				store.swapRows();
				forceUpdate();
			},
		};
	}, []);

	return (
		<div className="container">
			<table className="table table-hover table-striped test-data">
				<tbody>
					{store.data.map((d, i) => {
						return (
							<Row
								key={d.id}
								styleClass={d.id === store.selected ? "danger" : ""}
								onClick={app.select}
								onDelete={app.delete}
								data={d}
							/>
						);
					})}
				</tbody>
			</table>
			<span
				className="preloadicon glyphicon glyphicon-remove"
				aria-hidden="true"
			/>
		</div>
	);
}

/** @type {(rootDom: HTMLElement, props?: MainProps ) => TableApp} */
export function render(rootDom, props) {
	if (!props) props = { store: new Store() };
	preactRender(<Main {...props} />, rootDom);
	return app;
}

/** @type {(rootDom: HTMLElement, props?: MainProps ) => TableApp} */
export function hydrate(rootDom, props) {
	if (!props) props = { store: new Store() };
	preactHydrate(<Main {...props} />, rootDom);
	return app;
}
