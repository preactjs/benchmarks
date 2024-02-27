import { buildTable } from "./format.js";
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

/** @type {(tachResults: TachResult[]) => BenchmarkResult[]} */
function buildBenchmarkResults(tachResults) {
	/** @type {BenchmarkResult[]} */
	const results = [];

	for (const tachResult of tachResults) {
		const { baseName, implId, depGroupId, dependencies } = parseBenchmarkId(
			tachResult.result.name,
		);

		const measureName = tachResult.result.measurement.name;
		let benchmarkResult = results.find(
			(m) => m.benchName === baseName && m.measurement.name === measureName,
		);

		if (!benchmarkResult) {
			/** @type {BenchmarkResult} */
			benchmarkResult = {
				benchName: baseName,
				measurement: tachResult.result.measurement,
				browser: tachResults[0].result.browser,
				variations: [],
			};
			results.push(benchmarkResult);
		}

		const samples = tachResult.result.millis;
		benchmarkResult.variations.push({
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

	buildTable(results);

	return results;
}
