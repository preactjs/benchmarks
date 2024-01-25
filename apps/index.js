// To test:
// - Changing app updates benchmarks & implementations
// - Changing app or benchmark updates form action
// - Form state is saved & restored after submitting

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
const depGroup = /** @type {HTMLDivElement} */ (
	document.getElementById("dependencies")
);

const storageKey = "previousConfig";
const initialConfig = readSavedFormValues();
const state = {
	app: initialConfig.get("app") ?? "",
	benchmark: initialConfig.get("benchmark") ?? "",
	impl: initialConfig.get("impl") ?? "",
};

mount();

function getCurrentFormValues() {
	const formData = new FormData(form);
	formData.set("app", appSelect.value);
	formData.set("benchmark", benchmarkSelect.value);
	// @ts-expect-error DOM types are wrong
	return new URLSearchParams(formData);
}

function saveFormValues() {
	const values = getCurrentFormValues();
	sessionStorage.setItem(storageKey, values.toString());
}

function readSavedFormValues() {
	return new URLSearchParams(sessionStorage.getItem(storageKey) ?? "");
}

function mount() {
	// Add app options
	const apps = Object.keys(config.apps);
	appSelect.innerHTML = "";
	for (let app of apps) {
		const option = document.createElement("option");
		option.value = app;
		option.textContent = app;
		option.selected = app === state.app;
		appSelect.appendChild(option);
	}

	// Create dependency select elements
	const dependencies = Object.keys(config.dependencies);
	depGroup.innerHTML = "";

	for (let dep of dependencies) {
		const depId = `${dep}-version`;
		const label = document.createElement("label");
		label.textContent = `${dep} version: `;
		label.htmlFor = depId;
		const select = document.createElement("select");
		select.id = depId;
		select.name = dep;

		for (let version of Object.keys(config.dependencies[dep])) {
			const option = document.createElement("option");
			option.value = version;
			option.textContent = version;
			option.selected = version === initialConfig.get(dep);
			select.appendChild(option);
		}

		depGroup.appendChild(label);
		depGroup.appendChild(select);
	}

	// Add listeners
	appSelect.addEventListener("input", rerender);
	benchmarkSelect.addEventListener("input", rerender);
	form.addEventListener("submit", saveFormValues);

	// Mount dependent select boxes
	rerenderBenchmarks();
	form.action = `/apps/${appSelect.value}/${benchmarkSelect.value}`;
}

function rerender() {
	const newApp = appSelect.value;
	const newBenchmark = benchmarkSelect.value;
	if (newApp !== state.app) {
		rerenderBenchmarks();
		state.app = newApp;
	} else if (newBenchmark !== state.benchmark) {
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
