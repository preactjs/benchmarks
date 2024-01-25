import { createElement, Fragment, render } from "preact";
import { useState } from "preact/hooks";

/** @jsx createElement */
/** @jsxFrag Fragment */

/** @type {(props: { config: RootConfig }) => preact.JSX.Element} */
function BenchmarkSelector({ config }) {
	const apps = Object.entries(config.apps);
	const [selectedApp, setSelectedApp] = useState(apps[0][0]);

	const benchmarks = Object.keys(config.apps[selectedApp].benchmarks);
	const [selectedBenchmark, setSelectedBenchmark] = useState(benchmarks[0]);

	const implementations = Object.keys(config.apps[selectedApp].implementations);
	const [selectedImpl, setSelectedImpl] = useState(implementations[0]);
	return (
		<form action={`/apps/${selectedApp}/${selectedBenchmark}`} method="get">
			<div>
				<label for="app-selector">Select a benchmarking app</label>
				<select
					id="app-selector"
					value={selectedApp}
					onInput={(e) => {
						const newApp = e.currentTarget.value;
						setSelectedApp(newApp);
						setSelectedBenchmark(
							Object.keys(config.apps[newApp].benchmarks)[0]
						);
						setSelectedImpl(
							Object.keys(config.apps[newApp].implementations)[0]
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
					{Object.keys(config.apps[selectedApp].benchmarks).map(
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

/** @type {(props: { config: RootConfig }) => preact.JSX.Element} */
function App({ config }) {
	return (
		<>
			<h1>Preact Benchmarks</h1>
			<BenchmarkSelector config={config} />
		</>
	);
}

if (typeof window !== "undefined") {
	const config = window.configData;
	const root = document.getElementById("root");

	if (!config) throw new Error(`Missing configData`);
	if (!root) throw new Error('Missing element with id "root"');

	render(<App config={config} />, root);
}
