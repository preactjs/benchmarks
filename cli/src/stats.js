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
import { computeDifference } from "tachometer/lib/stats.js";

/** @type {(results: BenchmarkResults) => void} */
export function computeStats(results) {
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
			result.stats.histogram = getSparkline(samples, sampleRange);

			// TODO: Verify confidence interval calc
			// TODO: Add p-value, stat-sig, z-score(?)
			// TODO: calculate a power metric & MDE

			result.differences = measurement.results.map((other) =>
				other === result ? null : computeDifference(other.stats, result.stats),
			);

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
