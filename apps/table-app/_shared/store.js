/** @type {(max: number) => number} */
function _random(max) {
	return Math.round(Math.random() * 1000) % max;
}

/**
 * @typedef TableApp
 * @property {() => void} run
 * @property {() => void} add
 * @property {() => void} update
 * @property {(id: number) => void} select
 * @property {(id: number) => void} delete
 * @property {() => void} runLots
 * @property {() => void} clear
 * @property {() => void} swapRows
 */

/** @typedef {{id: number; label: string}} Data */

/**
 * @typedef RowProps
 * @property {string} styleClass
 * @property {(id: Data["id"]) => void} onClick
 * @property {(id: Data["id"]) => void} onDelete
 * @property {Data} data
 */

/** @typedef {{ store: Store }} MainProps */

export class Store {
	constructor() {
		/** @type {Data[]} */
		this.data = [];
		/** @type {Data["id"] | undefined} */
		this.selected = undefined;
		/** @type {number} */
		this.id = 1;
	}
	buildData(count = 1000) {
		var adjectives = [
			"pretty",
			"large",
			"big",
			"small",
			"tall",
			"short",
			"long",
			"handsome",
			"plain",
			"quaint",
			"clean",
			"elegant",
			"easy",
			"angry",
			"crazy",
			"helpful",
			"mushy",
			"odd",
			"unsightly",
			"adorable",
			"important",
			"inexpensive",
			"cheap",
			"expensive",
			"fancy",
		];
		var colours = [
			"red",
			"yellow",
			"blue",
			"green",
			"pink",
			"brown",
			"purple",
			"brown",
			"white",
			"black",
			"orange",
		];
		var nouns = [
			"table",
			"chair",
			"house",
			"bbq",
			"desk",
			"car",
			"pony",
			"cookie",
			"sandwich",
			"burger",
			"pizza",
			"mouse",
			"keyboard",
		];
		var data = [];
		for (var i = 0; i < count; i++)
			data.push({
				id: this.id++,
				label:
					adjectives[_random(adjectives.length)] +
					" " +
					colours[_random(colours.length)] +
					" " +
					nouns[_random(nouns.length)],
			});
		return data;
	}
	updateData(mod = 10) {
		for (let i = 0; i < this.data.length; i += 10) {
			this.data[i] = Object.assign({}, this.data[i], {
				label: this.data[i].label + " !!!",
			});
		}
	}
	/** @param {number} id */
	delete(id) {
		var idx = this.data.findIndex((d) => d.id === id);
		this.data.splice(idx, 1);
	}
	run() {
		this.data = this.buildData();
		this.selected = undefined;
	}
	add() {
		this.data = this.data.concat(this.buildData(1000));
	}
	update() {
		this.updateData();
	}
	/** @param {number} id */
	select(id) {
		this.selected = id;
	}
	runLots() {
		this.data = this.buildData(10000);
		this.selected = undefined;
	}
	clear() {
		this.data = [];
		this.selected = undefined;
	}
	swapRows() {
		if (this.data.length > 998) {
			var a = this.data[1];
			this.data[1] = this.data[998];
			this.data[998] = a;
		}
	}
}
