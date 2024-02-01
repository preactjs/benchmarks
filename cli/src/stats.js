import { bin } from "d3-array";
import { scaleLinear } from "d3-scale";

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
