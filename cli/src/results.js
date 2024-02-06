import kleur from "kleur";
import table from "table";
import { computeStats } from "./stats.js";
import { parseBenchmarkId } from "./utils.js";

/** @type {(results: TachResult[]) => Promise<void>} */
export async function displayResults(tachResults) {
	(await import("fs")).writeFileSync(
		"out/results.json",
		JSON.stringify(tachResults, null, 2),
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
			tachResult.result.name,
		);

		if (!measureName) {
			throw new Error(
				`No measure name found in result: ${tachResult.result.name}`,
			);
		}

		if (baseName !== results.name) {
			throw new Error(
				`Mismatched benchmark names: ${baseName} !== ${results.name}`,
			);
		}

		if (results.browser.name !== tachResult.result.browser.name) {
			throw new Error(
				`Mismatched browser: ${results.browser} !== ${tachResult.result.browser}`,
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
				...tachResult.stats,
				histogram: "",
			},
			differences: [],
		});
	}

	computeStats(results);

	return results;
}

/** @type {(measure: MeasurementResult) => any} */
function buildTableForMeasurement(measure) {}

/**
 * Format a confidence interval as "[low, high]".
 * @type {(ci: ConfidenceInterval, format: (n: number) => string) => string}
 */
function formatConfidenceInterval(ci, format) {
	return `${format(ci.low)} ${kleur.gray("-")} ${format(ci.high)}`;
}

/**
 * Prefix positive numbers with a red "+" and negative ones with a green "-".
 * @type {(n: number, format: (n: number) => string) => string}
 */
function colorizeSign(n, format) {
	if (n > 0) {
		return kleur.red(kleur.bold("+")) + format(n);
	} else if (n < 0) {
		// Negate the value so that we don't get a double negative sign.
		return kleur.green().bold("-") + format(-n);
	} else {
		return format(n);
	}
}

/** @type {(difference: Difference) => string} */
function formatDifference({ absolute, relative }) {
	let word, rel, abs;
	if (absolute.low > 0 && relative.low > 0) {
		word = kleur.bold().red("slower");
		rel = formatConfidenceInterval(relative, percent);
		abs = formatConfidenceInterval(absolute, milli);
	} else if (absolute.high < 0 && relative.high < 0) {
		word = kleur.bold().green("faster");
		rel = formatConfidenceInterval(negate(relative), percent);
		abs = formatConfidenceInterval(negate(absolute), milli);
	} else {
		word = kleur.bold().blue("unsure");
		rel = formatConfidenceInterval(relative, (n) => colorizeSign(n, percent));
		abs = formatConfidenceInterval(absolute, (n) => colorizeSign(n, milli));
	}

	return `{word}\n${rel}\n${abs}`;
}

/** @type {(n: number) => string} */
function percent(n) {
	return (n * 100).toFixed(0) + "%";
}

/** @type {(n: number) => string} */
function milli(n) {
	return n.toFixed(2) + "ms";
}

/** @type {(ci: ConfidenceInterval) => ConfidenceInterval} */
function negate(ci) {
	return {
		low: -ci.high,
		high: -ci.low,
	};
}
