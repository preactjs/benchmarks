import * as path from "path";
import { deleteAsync } from "del";
import { writeFile, mkdir } from "fs/promises";
import {
	baseTraceLogDir,
	configDir,
	getBenchmarkBaseName,
	getBenchmarkId,
	getBenchmarkURL,
	repoRoot,
} from "./utils.js";

const measureName = "duration"; // Must match measureName in '../src/util.js'
const TACH_SCHEMA =
	"https://raw.githubusercontent.com/Polymer/tachometer/master/config.schema.json";

/** @type {(benchName: string) => ConfigFileBenchmark["measurement"]} */
function getMeasurements(benchName) {
	/** @type {ConfigFileBenchmark["measurement"]} */
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
 * @param {string} benchName
 * @param {BrowserConfigs} browser
 * @param {BenchmarkActionConfig} options
 */
async function addTraceOption(benchName, browser, options) {
	if (browser.name == "chrome" && options.trace) {
		const traceLogDir = baseTraceLogDir(benchName);
		await deleteAsync("**/*", { cwd: traceLogDir });
		await mkdir(traceLogDir, { recursive: true });

		browser.trace = {
			logDir: traceLogDir,
		};
	}
}

/**
 * @typedef {import('tachometer/lib/configfile').ConfigFile} ConfigFile Expected
 * format of a top-level tachometer JSON config file.
 * @typedef {Required<ConfigFile["benchmarks"][0]>} ConfigFileBenchmark
 * @typedef {{ name: string; configPath: string; config: ConfigFile; }} ConfigData
 * @param {string} benchmarkFile
 * @param {BenchmarkActionConfig} benchConfig
 * @returns {Promise<ConfigData>}
 */
export async function generateConfig(benchmarkFile, benchConfig) {
	const baseName = getBenchmarkBaseName(benchmarkFile);

	// See https://www.npmjs.com/package/tachometer#browsers
	// and https://www.npmjs.com/package/tachometer#config-file
	/** @type {BrowserConfigs} */
	const browser = parseBrowserOption(benchConfig.browser);
	await addTraceOption(baseName, browser, benchConfig);

	const measurement = getMeasurements(baseName);
	const baseBenchConfig = { measurement, browser };

	const baseUrl = new URL("http://localhost:" + benchConfig.port);

	/** @type {ConfigFileBenchmark["expand"]} */
	const expand = [];
	for (let impl of benchConfig.implementations) {
		for (let depGroup of benchConfig.depGroups) {
			expand.push({
				name: getBenchmarkId(baseName, depGroup, impl).fullName,
				url: getBenchmarkURL(baseUrl, benchmarkFile, depGroup, impl).toString(),
			});
		}
	}

	/** @type {ConfigFile} */
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

	const configPath = await writeConfig(baseName, tachConfig);

	return { name: baseName, configPath, config: tachConfig };
}

/** @type {(name: string, config: ConfigFile) => Promise<string>} */
async function writeConfig(name, config) {
	const configPath = configDir(name + ".config.json");
	await mkdir(path.dirname(configPath), { recursive: true });
	await writeFile(configPath, JSON.stringify(config, null, 2), "utf8");

	return configPath;
}

/**
 * @typedef {Exclude<ConfigFileBenchmark["browser"], string | undefined>} BrowserConfigs
 * @param {string} str
 * @returns {BrowserConfigs}
 */
function parseBrowserOption(str) {
	// Source: https://github.com/Polymer/tachometer/blob/d4d5116acb2d7df18035ddc36f0a3a1730841a23/src/browser.ts#L100
	let remoteUrl;
	const at = str.indexOf("@");
	if (at !== -1) {
		remoteUrl = str.substring(at + 1);
		str = str.substring(0, at);
	}
	const headless = str.endsWith("-headless");
	if (headless === true) {
		str = str.replace(/-headless$/, "");
	}

	/** @type {import('tachometer/lib/browser').BrowserName} */
	// @ts-ignore
	const name = str;

	/** @type {BrowserConfigs} */
	const config = { name, headless };
	if (remoteUrl !== undefined) {
		config.remoteUrl = remoteUrl;
	}

	// Custom browser options
	if (config.name == "chrome") {
		config.addArguments = [
			"--js-flags=--expose-gc",
			"--enable-precise-memory-info",
		];
	}

	return config;
}
