const config = /** @type {RootConfig} */ (window.configData);
if (!config) throw new Error("Missing config data");

const form = /** @type {HTMLFormElement} */ (
	document.getElementById("benchmark-form")
);
const appSelect = /** @type {HTMLSelectElement} */ (
	document.getElementById("app-select")
);
const benchmarkSelect = /** @type {HTMLSelectElement} */ (
	document.getElementById("benchmark-select")
);
const implSelect = /** @type {HTMLSelectElement} */ (
	document.getElementById("impl-select")
);

const state = {
	app: "",
	benchmark: "",
	impl: "",
};

function mount() {
	const apps = Object.keys(config.apps);
	appSelect.innerHTML = "";
	for (let app of apps) {
		const option = document.createElement("option");
		option.value = app;
		option.textContent = app;
		appSelect.appendChild(option);
	}

	appSelect.addEventListener("input", rerender);
	benchmarkSelect.addEventListener("input", rerender);

	rerender();
}

function rerender() {
	const newApp = appSelect.value;
	const newBenchmark = benchmarkSelect.value;
	if (newApp !== state.app) {
		rerenderBenchmarks();
		state.app = newApp;
	}

	if (newBenchmark !== state.benchmark) {
		rerenderImplementations();
		state.benchmark = newBenchmark;
	}

	form.action = `/apps/${appSelect.value}/${benchmarkSelect.value}`;
}

function rerenderBenchmarks() {
	const benchmarks = Object.keys(config.apps[appSelect.value].benchmarks);

	benchmarkSelect.innerHTML = "";
	for (let benchmark of benchmarks) {
		const option = document.createElement("option");
		option.value = benchmark;
		option.textContent = benchmark;
		benchmarkSelect.appendChild(option);
	}

	state.benchmark = benchmarkSelect.value = benchmarks.includes(state.benchmark)
		? state.benchmark
		: benchmarks[0];

	rerenderImplementations();
}

function rerenderImplementations() {
	const implementations = Object.keys(
		config.apps[appSelect.value].implementations
	);

	implSelect.innerHTML = "";
	for (let impl of implementations) {
		const option = document.createElement("option");
		option.value = impl;
		option.textContent = impl;
		implSelect.appendChild(option);
	}

	state.impl = implSelect.value = implementations.includes(state.impl)
		? state.impl
		: implementations[0];
}

mount();
