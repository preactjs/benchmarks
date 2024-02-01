import { writeFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import * as path from "node:path";
import { deleteAsync } from "del";
import { main } from "tachometer";
import {
	baseTraceLogDir,
	configDir,
	getBenchmarkBaseName,
	getBenchmarkId,
	getBenchmarkURL,
	repoRoot,
	resultsPath,
} from "./utils.js";

const require = createRequire(import.meta.url);

const measureName = "duration"; // Must match measureName in '../src/util.js'
const TACH_SCHEMA =
	"https://raw.githubusercontent.com/Polymer/tachometer/master/config.schema.json";

/** @type {(benchName: string) => TachBenchmarkConfig["measurement"]} */
function getMeasurements(benchName) {
	/** @type {TachBenchmarkConfig["measurement"]} */
	let measurement;
	if (benchName == "replace1k") {
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
 * @param {string} benchmarkFile
 * @param {BenchmarkConfig} benchConfig
 * @returns {Promise<{ name: string; configPath: string; config: TachConfig; }>}
 */
async function generateTachConfig(benchmarkFile, benchConfig) {
	const baseName = getBenchmarkBaseName(benchmarkFile);

	if (benchConfig.browser.name == "chrome" && benchConfig.trace) {
		const traceLogDir = baseTraceLogDir(baseName);
		await deleteAsync("**/*", { cwd: traceLogDir });
		await mkdir(traceLogDir, { recursive: true });

		benchConfig.browser.trace = {
			logDir: traceLogDir,
		};
	}

	const measurement = getMeasurements(baseName);
	const baseBenchConfig = { measurement, browser: benchConfig.browser };

	const baseUrl = new URL("http://localhost:" + benchConfig.port);

	/** @type {TachBenchmarkConfig["expand"]} */
	const expand = [];
	for (let impl of benchConfig.implementations) {
		for (let depGroup of benchConfig.depGroups) {
			expand.push({
				name: getBenchmarkId(baseName, depGroup, impl).fullName,
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

	const tachConfigPath = configDir(baseName + ".config.json");
	await mkdir(path.dirname(tachConfigPath), { recursive: true });
	await writeFile(tachConfigPath, JSON.stringify(tachConfig, null, 2), "utf8");

	return { name: baseName, configPath: tachConfigPath, config: tachConfig };
}

/**
 * @param {import('child_process').ChildProcess} childProcess
 * @returns {Promise<void>}
 */
async function waitForExit(childProcess) {
	return new Promise((resolve, reject) => {
		childProcess.once("exit", (code, signal) => {
			if (code === 0 || signal == "SIGINT") {
				resolve();
			} else {
				reject(new Error("Exit with error code: " + code));
			}
		});

		childProcess.once("error", (err) => {
			reject(err);
		});
	});
}

/** @type {(benchmarkFile: string, benchConfig: BenchmarkConfig) => Promise<TachResult[]>} */
export async function runTach(benchmarkFile, benchConfig) {
	const { name, configPath } = await generateTachConfig(
		benchmarkFile,
		benchConfig,
	);

	/** @type {TachResult[] | undefined} */
	let results;

	// Disable console.log while Tach is running to prevent the giant table from
	// printing to the console so our own results table is the only output.
	const realLog = console.log;
	try {
		console.log = () => {};
		results = await main([
			"--config",
			configPath,
			"--json-file",
			resultsPath(name + ".json"),
		]);
	} finally {
		console.log = realLog;
	}

	if (!results) throw new Error(`Tachometer did not produce any results.`);
	return results;
}
