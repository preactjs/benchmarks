// Many of these routines are inspired by the TracerBench project. We write our
// own here cuz their methods require exactly 2 sample groups (control &
// experiment) and we may have more than two. Further, some of the data (e.g.
// sparkline) doesn't require a comparison and is just a visualization on top of
// a group samples.
//
// Originally from
// https://github.com/TracerBench/tracerbench/blob/a0e2fd5af12caa153b34bd4b460cc6f98eb45b58/packages/stats/src/stats.ts
//
// TracerBench License: BSD 2-Clause "Simplified" License
// https://github.com/TracerBench/tracerbench/blob/a0e2fd5af12caa153b34bd4b460cc6f98eb45b58/LICENSE.md
//
// We also take inspiration from the Tachometer project, by Google. We
// re-implement some of the stats here in order to customize their display.
//
// Tachometer License: BSD 3-Clause "New" or "Revised" License
// https://github.com/google/tachometer/blob/fc8fda9ffda9565c23d615553cfd59960b29aa86/LICENSE

import { bin } from "d3-array";
import { scaleLinear } from "d3-scale";
import { parseBenchmarkId } from "./utils.js";

/** @type {(results: TachResult[]) => Promise<void>} */
export async function displayResults(tachResults) {
	(await import("fs")).writeFileSync(
		"out/results.json",
		JSON.stringify(tachResults, null, 2)
	);

	if (tachResults.length === 0) {
		console.log("No results to display");
		return;
	}

	const result = buildBenchmarkResults(tachResults);
}

/** @type {(tachResults: TachResult[]) => BenchmarkResults} */
function buildBenchmarkResults(tachResults) {
	const { baseName } = parseBenchmarkId(tachResults[0].result.name);
	/** @type {BenchmarkResults} */
	const results = {
		name: baseName,
		browser: tachResults[0].result.browser,
		measurements: [],
	};

	for (const tachResult of tachResults) {
		const measureName = tachResult.result.measurement.name;
		const { baseName, implId, depGroupId, dependencies } = parseBenchmarkId(
			tachResult.result.name
		);

		if (!measureName) {
			throw new Error(
				`No measure name found in result: ${tachResult.result.name}`
			);
		}

		if (baseName !== results.name) {
			throw new Error(
				`Mismatched benchmark names: ${baseName} !== ${results.name}`
			);
		}

		if (results.browser.name !== tachResult.result.browser.name) {
			throw new Error(
				`Mismatched browser: ${results.browser} !== ${tachResult.result.browser}`
			);
		}

		let measurement = results.measurements.find((m) => m.name === measureName);
		if (!measurement) {
			measurement = {
				name: measureName,
				measurement: tachResult.result.measurement,
				results: [],
			};
			results.measurements.push(measurement);
		}

		const samples = tachResult.result.millis;

		measurement.results.push({
			fullName: tachResult.result.name,
			implementation: implId,
			depGroupId,
			dependencies,
			samples,
			stats: {
				size: samples.length,
				mean: 0,
				meanCI: { low: 0, high: 0 },
				variance: 0,
				standardDeviation: 0,
				sparkline: "",
			},
		});
	}

	computeStats(results);

	return results;
}

/** @type {(results: BenchmarkResults) => void} */
function computeStats(results) {
	for (let measurement of results.measurements) {
		console.log();
		console.log("=".repeat(40));
		console.log("measurement:", measurement.name);

		const allSamples = measurement.results.flatMap((m) => m.samples);
		const sampleRange = {
			min: Math.min(...allSamples),
			max: Math.max(...allSamples),
		};

		for (let result of measurement.results) {
			console.log(result.implementation, result.depGroupId);

			const samples = result.samples;
			const size = samples.length;
			const mean = sumOf(samples) / size;
			// size - 1 due to https://en.wikipedia.org/wiki/Bessel%27s_correction
			const variance = sumOf(samples, (n) => (n - mean) ** 2) / (size - 1);
			const stdDev = Math.sqrt(variance);
			const meanCI = { low: 0, high: 0 }; // TODO: Implement

			result.stats = {
				...result.stats,
				size,
				mean,
				variance,
				standardDeviation: stdDev,
				meanCI,
				sparkline: getSparkline(samples, sampleRange),
			};

			console.log(result.stats);
		}
	}
}

/**
 * @param {{ min: number; max: number; }} range
 * @param {number[]} a
 * @returns {number[]}
 */
function getHistogram(range, a) {
	/** @type {any} Types on d3 seem to be wrong... this works */
	const scale = scaleLinear()
		.domain([range.min, range.max])
		.range([range.min, range.max]);

	const h = bin()
		.value((d) => d)
		.domain(scale.domain())
		.thresholds(scale.ticks());

	return h(a).map((i) => i.length);
}

/**
 * @param {number[]} samples
 * @param {{ min: number; max: number; }} totalRange
 * @returns {string}
 */
function getSparkline(samples, totalRange) {
	const sortedSamples = [...samples].sort((a, b) => a - b);
	const histogram = getHistogram(totalRange, sortedSamples);
	console.log(histogram);

	const min = Math.min(...histogram);
	const max = Math.max(...histogram);

	/** @type {(n: number, bits: number) => number} */
	function lshift(n, bits) {
		return Math.floor(n) * Math.pow(2, bits);
	}

	const ticks = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
	/** @type {string[]} */
	const results = [];
	let f = Math.floor(lshift(max - min, 8) / (ticks.length - 1));

	if (f < 1) {
		f = 1;
	}

	histogram.forEach((n) => {
		const value = ticks[Math.floor(lshift(n - min, 8) / f)];
		results.push(value);
	});

	return `${results.join("")}`;
}

/** @type {(n: number) => number} */
const identity = (n) => n;

/** @type {(numbers: number[], mapFn?: (n: number) => number) => number} */
function sumOf(numbers, mapFn = identity) {
	return numbers.reduce((sum, n) => sum + mapFn(n), 0);
}
