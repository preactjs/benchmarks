import { writeFile, mkdir } from "node:fs/promises";
import * as path from "node:path";
import { deleteAsync } from "del";
import { main } from "tachometer";
import {
	appFilePath,
	baseTraceLogDir,
	configDir,
	getBenchmarkBaseName,
	getBenchmarkURL,
	makeDepVersion,
	repoRoot,
	resultsPath,
} from "./utils.js";

const measureName = "duration"; // Must match measureName in '../src/util.js'
const TACH_SCHEMA =
	"https://raw.githubusercontent.com/Polymer/tachometer/master/config.schema.json";

/** @type {(benchName: string) => TachBenchmarkConfig["measurement"]} */
function getMeasurements(benchName) {
	/** @type {TachBenchmarkConfig["measurement"]} */
	let measurement;
	if (benchName == "table-app/replace1k") {
		// MUST BE KEPT IN SYNC WITH WARMUP COUNT IN 02_replace1k.html
		const WARMUP_COUNT = 5;

		// For 02_replace1k, collect additional measurements focusing on the JS
		// clock time for each warmup and the final duration.
		measurement = [
			{
				name: "duration",
				mode: "performance",
				entryName: measureName,
			},
			{
				name: "usedJSHeapSize",
				mode: "expression",
				expression: "window.usedJSHeapSize",
			},
		];

		for (let i = 0; i < WARMUP_COUNT; i++) {
			const entryName = `run-warmup-${i}`;
			measurement.push({
				name: entryName,
				mode: "performance",
				entryName,
			});
		}

		measurement.push({
			name: "run-final",
			mode: "performance",
			entryName: "run-final",
		});
	} else {
		// Default measurements
		measurement = [
			{
				name: "duration",
				mode: "performance",
				entryName: measureName,
			},
			{
				name: "usedJSHeapSize",
				mode: "expression",
				expression: "window.usedJSHeapSize",
			},
		];
	}

	return measurement;
}

/**
 * Given a benchmark configuration, determine the label for a benchmark based on
 * the implementation and dependency group, not including implementations or dep
 * groups if there is only one in the configuration.
 * @param {BenchmarkConfig} benchConfig
 * @returns {(impl: string, depGroup: DependencyGroup) => string}
 */
function createBenchmarkNameFactory(benchConfig) {
	const { implementations, depGroups } = benchConfig;
	const implCount = implementations.length;
	const depGroupCount = depGroups.length;

	return (impl, depGroup) => {
		if (implCount == 1 && depGroupCount == 1) {
			const depGroupLabel = depGroup
				.map(([name, version]) => makeDepVersion(name, version))
				.join(" ");

			return `${impl} ${depGroupLabel}`;
		}

		let label = "";
		if (implCount > 1) {
			label += impl;
		}

		if (depGroupCount > 1) {
			if (label) label += " ";
			label += depGroup
				.map(([name, version]) => makeDepVersion(name, version))
				.join(" ");
		}

		return label;
	};
}

/**
 * @param {string} benchmarkFile
 * @param {BenchmarkConfig} benchConfig
 * @returns {Promise<{ basePath: string; configPath: string; config: TachConfig; }>}
 */
async function generateTachConfig(benchmarkFile, benchConfig) {
	const basePath = path
		.relative(appFilePath(), benchmarkFile)
		.replace(/\.html$/, "");

	if (benchConfig.browser.name == "chrome" && benchConfig.trace) {
		const traceLogDir = baseTraceLogDir(basePath);
		await deleteAsync("**/*", { cwd: traceLogDir });
		await mkdir(traceLogDir, { recursive: true });

		benchConfig.browser.trace = {
			logDir: traceLogDir,
		};
	}

	const measurement = getMeasurements(basePath);
	const baseBenchConfig = { measurement, browser: benchConfig.browser };

	const baseUrl = new URL("http://localhost:" + benchConfig.port);

	const getName = createBenchmarkNameFactory(benchConfig);

	/** @type {TachBenchmarkConfig["expand"]} */
	const expand = [];
	const baseName = getBenchmarkBaseName(benchmarkFile);
	for (let impl of benchConfig.implementations) {
		for (let depGroup of benchConfig.depGroups) {
			expand.push({
				name: getName(impl, depGroup),
				url: getBenchmarkURL(baseUrl, benchmarkFile, depGroup, impl).toString(),
			});
		}
	}

	/** @type {TachConfig} */
	const tachConfig = {
		$schema: TACH_SCHEMA,
		root: path.relative(configDir(), repoRoot()),
		sampleSize: benchConfig["sample-size"],
		timeout: benchConfig.timeout,
		autoSampleConditions: benchConfig.horizon.split(","),
		benchmarks: [
			{
				...baseBenchConfig,
				expand,
			},
		],
	};

	const tachConfigPath = configDir(basePath + ".config.json");
	await mkdir(path.dirname(tachConfigPath), { recursive: true });
	await writeFile(tachConfigPath, JSON.stringify(tachConfig, null, 2), "utf8");

	return { basePath, configPath: tachConfigPath, config: tachConfig };
}

/** @type {(benchmarkFile: string, benchConfig: BenchmarkConfig) => Promise<TachResult[]>} */
export async function runTach(benchmarkFile, benchConfig) {
	const { basePath, configPath } = await generateTachConfig(
		benchmarkFile,
		benchConfig,
	);

	const jsonFilePath = resultsPath(basePath + ".json");
	await mkdir(path.dirname(jsonFilePath), { recursive: true });

	/** @type {TachResult[] | undefined} */
	let results;

	// Disable console.log while Tach is running to prevent the giant table from
	// printing to the console so our own results table is the only output.
	const realLog = console.log;
	try {
		console.log = () => {};
		results = await main(["--config", configPath, "--json-file", jsonFilePath]);
	} finally {
		console.log = realLog;
	}

	if (!results) throw new Error(`Tachometer did not produce any results.`);
	return results;
}
