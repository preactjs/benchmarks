import { createElement, Fragment, render } from "preact";
import { useState } from "preact/hooks";

/** @jsx createElement */
/** @jsxFrag Fragment */

function BenchmarkSelector() {
	const configData = window.configData;
	if (!configData) {
		throw new Error(`Missing configData`);
	}

	const apps = Object.entries(configData.apps);
	const [selectedApp, setSelectedApp] = useState(apps[0][0]);

	const benchmarks = Object.keys(configData.apps[selectedApp].benchmarks);
	const [selectedBenchmark, setSelectedBenchmark] = useState(benchmarks[0]);

	const implementations = Object.keys(
		configData.apps[selectedApp].implementations
	);
	const [selectedImpl, setSelectedImpl] = useState(implementations[0]);
	return (
		<form action={`/app/${selectedApp}/${selectedBenchmark}`} method="get">
			<div>
				<label for="app-selector">Select a benchmarking app</label>
				<select
					id="app-selector"
					value={selectedApp}
					onInput={(e) => {
						const newApp = e.currentTarget.value;
						setSelectedApp(newApp);
						setSelectedBenchmark(
							Object.keys(configData.apps[newApp].benchmarks)[0]
						);
						setSelectedImpl(
							Object.keys(configData.apps[newApp].implementations)[0]
						);
					}}
				>
					{apps.map(([appName, app]) => (
						<option value={appName}>{appName}</option>
					))}
				</select>
			</div>
			<div>
				<label for="benchmark-selector">Select a benchmark</label>
				<select
					id="benchmark-selector"
					value={selectedBenchmark}
					onInput={(e) => {
						setSelectedBenchmark(e.currentTarget.value);
					}}
				>
					{Object.keys(configData.apps[selectedApp].benchmarks).map(
						(benchmarkName) => (
							<option value={benchmarkName}>{benchmarkName}</option>
						)
					)}
				</select>
			</div>
			<div>
				<label for="implementation-selector">Select an implementation</label>
				<select
					name="impl"
					id="implementation-selector"
					value={selectedImpl}
					onInput={(e) => {
						setSelectedImpl(e.currentTarget.value);
					}}
				>
					{implementations.map((implementation) => (
						<option value={implementation}>{implementation}</option>
					))}
				</select>
			</div>
			<div>
				<button type="submit">Load benchmark</button>
			</div>
		</form>
	);
}

function App() {
	return (
		<>
			<h1>Preact Benchmarks</h1>
			<BenchmarkSelector />
		</>
	);
}

const root = document.getElementById("root");
if (!root) throw new Error('Missing element with id "root"');
render(<App />, root);
