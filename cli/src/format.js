import kleur from "kleur";
import table from "table";
import { makeBenchmarkLabel, makeDepGroupLabel } from "./utils.js";

/** @type {(benchmarkResult: BenchmarkResult, fixedDimensions: Dimension[]) => string} */
function getTableTitle(benchmarkResult, fixedDimensions) {
	const benchmarkName = benchmarkResult.benchName;
	const browser = benchmarkResult.browser;
	const measurementName = benchmarkResult.measurement.name ?? "";

	const browserName = `${browser.name}${browser.headless ? "-headless" : ""}`;
	const firstVariation = benchmarkResult.variations[0];
	const details = [
		browserName,
		...fixedDimensions.map((d) => d.format(firstVariation)),
	];

	return `${kleur.bold(benchmarkName)} - ${kleur.bold(measurementName)} (${details.join("; ")})`;
}

/** @type {Dimension} */
const sampleSizeDimension = {
	format: (r) => r.samples.length.toString(),
	label: "Sample Size",
};

/** @type {Dimension} */
const implementationDimension = {
	format: (r) => r.implementation,
	label: "Implementation",
};

/** @type {Dimension} */
const depGroupDimension = {
	format: (r) => makeDepGroupLabel(r.dependencies),
	label: "Dependency Group",
};

/** @type {(format: (n: number) => string) => Dimension} */
const createMeanValueDimension = (format) => ({
	format: (r) => {
		return [
			formatConfidenceInterval(r.stats.meanCI, format),
			"",
			r.stats.histogram,
		].join("\n");
	},
	label: "Mean",
	tableConfig: { alignment: "right" },
});

/** @type {(benchmark: BenchmarkResult[]) => any} */
export function displayTable(benchmarkResults) {
	for (let benchmarkResult of benchmarkResults) {
		let formatNum = milli;
		if (benchmarkResult.measurement.name === "usedJSHeapSize") {
			formatNum = megabytes;
		}

		const sampleSizeSet = new Set(
			benchmarkResult.variations.map((r) => r.samples.length),
		);
		const implSet = new Set(
			benchmarkResult.variations.map((r) => r.implementation),
		);
		const depGroupSet = new Set(
			benchmarkResult.variations.map((r) => r.depGroupId),
		);

		const fixedDimensions = [
			...(sampleSizeSet.size === 1 ? [sampleSizeDimension] : []),
			...(implSet.size === 1 ? [implementationDimension] : []),
			...(depGroupSet.size === 1 ? [depGroupDimension] : []),
		];

		const varyingDimensions = [
			...(implSet.size === 1 ? [] : [implementationDimension]),
			...(depGroupSet.size === 1 ? [] : [depGroupDimension]),
			...(sampleSizeSet.size === 1 ? [] : [sampleSizeDimension]),
		];

		/** @type {Dimension[]} */
		const vsDimensions = [];
		if (benchmarkResult.variations.length > 1) {
			const includeDepGroup = depGroupSet.size > 1;
			const includeImpl = implSet.size > 1;

			for (let i = 0; i < benchmarkResult.variations.length; i++) {
				const variation = benchmarkResult.variations[i];

				vsDimensions.push({
					label:
						"vs " +
						makeBenchmarkLabel(
							includeImpl ? variation.implementation : null,
							includeDepGroup ? variation.dependencies : null,
						),
					format: (r) => {
						const diff = r.differences[i];
						if (!diff) return kleur.gray("\n-");
						return formatDifference(diff, formatNum);
					},
					tableConfig: { alignment: "right" },
				});
			}
		}

		/** @type {Dimension[]} */
		const tableDimensions = [
			...varyingDimensions,
			createMeanValueDimension(formatNum),
			...vsDimensions,
		];

		console.log(getTableTitle(benchmarkResult, fixedDimensions));
		console.log(
			horizontalTerminalTable(tableDimensions, benchmarkResult.variations),
		);
	}
}

/** @type {(dimensions: Dimension[], results: VariationResult[]) => string} */
function horizontalTerminalTable(dimensions, results) {
	const rows = [
		dimensions.map((d) => kleur.bold(d.label)),
		...results.map((r) => dimensions.map((d) => d.format(r))),
	];

	return table.table(rows, {
		border: table.getBorderCharacters("norc"),
		columns: dimensions.map((d) => d.tableConfig ?? {}),
	});
}

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

/** @type {(difference: Difference, format: (n: number) => string) => string} */
function formatDifference({ absolute, relative }, format) {
	let word, rel, abs;
	if (absolute.low > 0 && relative.low > 0) {
		word = kleur.bold().red("slower");
		rel = formatConfidenceInterval(relative, percent);
		abs = formatConfidenceInterval(absolute, format);
	} else if (absolute.high < 0 && relative.high < 0) {
		word = kleur.bold().green("faster");
		rel = formatConfidenceInterval(negate(relative), percent);
		abs = formatConfidenceInterval(negate(absolute), format);
	} else {
		word = kleur.bold().blue("unsure");
		rel = formatConfidenceInterval(relative, (n) => colorizeSign(n, percent));
		abs = formatConfidenceInterval(absolute, (n) => colorizeSign(n, format));
	}

	return `${word}\n${rel}\n${abs}`;
}

/** @type {(n: number) => string} */
function percent(n) {
	return (n * 100).toFixed(0) + "%";
}

/** @type {(n: number) => string} */
function milli(n) {
	return n.toFixed(2) + "ms";
}

/** @type {(n: number) => string} */
function megabytes(n) {
	return n.toFixed(2) + "MB";
}

/** @type {(ci: ConfidenceInterval) => ConfidenceInterval} */
function negate(ci) {
	return {
		low: -ci.high,
		high: -ci.low,
	};
}
