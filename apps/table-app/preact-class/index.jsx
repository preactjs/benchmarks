import {
	render as preactRender,
	hydrate as preactHydrate,
	createElement,
	Component,
} from "preact";
import { Store } from "../_shared/store.js";

/** @typedef {import('../_shared/store.js').RowProps} RowProps */
/** @typedef {import('../_shared/store.js').MainProps} MainProps */
/** @typedef {import("../_shared/store").TableApp} TableApp */

/** @extends {Component<RowProps>} */
class Row extends Component {
	/** @param {RowProps} props */
	constructor(props) {
		super(props);
		this.onDelete = this.onDelete.bind(this);
		this.onClick = this.onClick.bind(this);
	}

	/** @param {RowProps} nextProps */
	shouldComponentUpdate(nextProps) {
		return (
			nextProps.data !== this.props.data ||
			nextProps.styleClass !== this.props.styleClass
		);
	}

	onDelete() {
		this.props.onDelete(this.props.data.id);
	}

	onClick() {
		this.props.onClick(this.props.data.id);
	}

	render() {
		let { styleClass, data } = this.props;

		return (
			<tr className={styleClass}>
				<td className="col-md-1">{data.id}</td>
				<td className="col-md-4">
					<a onClick={this.onClick}>{data.label}</a>
				</td>
				<td className="col-md-1">
					<a onClick={this.onDelete}>
						<span className="glyphicon glyphicon-remove" aria-hidden="true" />
					</a>
				</td>
				<td className="col-md-6" />
			</tr>
		);
	}
}

/** @extends {Component<MainProps>} */
export class Main extends Component {
	/** @param {MainProps} props */
	constructor(props) {
		super(props);
		this.state = { store: props.store };
		this.select = this.select.bind(this);
		this.delete = this.delete.bind(this);

		// @ts-ignore
		window.app = this;
	}
	run() {
		this.state.store.run();
		this.setState({ store: this.state.store });
	}
	add() {
		this.state.store.add();
		this.setState({ store: this.state.store });
	}
	update() {
		this.state.store.update();
		this.setState({ store: this.state.store });
	}
	/** @param {number} id */
	select(id) {
		this.state.store.select(id);
		this.setState({ store: this.state.store });
	}
	/** @param {number} id */
	delete(id) {
		this.state.store.delete(id);
		this.setState({ store: this.state.store });
	}
	runLots() {
		this.state.store.runLots();
		this.setState({ store: this.state.store });
	}
	clear() {
		this.state.store.clear();
		this.setState({ store: this.state.store });
	}
	swapRows() {
		this.state.store.swapRows();
		this.setState({ store: this.state.store });
	}
	render() {
		let rows = this.state.store.data.map((d, i) => {
			return createElement(Row, {
				key: d.id,
				data: d,
				onClick: this.select,
				onDelete: this.delete,
				styleClass: d.id === this.state.store.selected ? "danger" : "",
			});
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
}

/** @type {(rootDom: HTMLElement, props: MainProps ) => TableApp} */
export function render(rootDom, props) {
	if (!props) props = { store: new Store() };
	preactRender(<Main {...props} />, rootDom);

	/** @type {import('../_shared/store.js').TableApp} */
	// @ts-expect-error
	const app = window.app;
	return {
		run: app.run.bind(app),
		add: app.add.bind(app),
		update: app.update.bind(app),
		select: app.select.bind(app),
		delete: app.delete.bind(app),
		runLots: app.runLots.bind(app),
		clear: app.clear.bind(app),
		swapRows: app.swapRows.bind(app),
	};
}

/** @type {(rootDom: HTMLElement, props?: MainProps ) => TableApp} */
export function hydrate(rootDom, props) {
	if (!props) props = { store: new Store() };
	preactHydrate(<Main {...props} />, rootDom);

	/** @type {import('../_shared/store.js').TableApp} */
	// @ts-expect-error
	const app = window.app;
	return {
		run: app.run.bind(app),
		add: app.add.bind(app),
		update: app.update.bind(app),
		select: app.select.bind(app),
		delete: app.delete.bind(app),
		runLots: app.runLots.bind(app),
		clear: app.clear.bind(app),
		swapRows: app.swapRows.bind(app),
	};
}
