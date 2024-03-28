/** Raw CLI arguments parsed from the command line or received from command line prompting */
interface BenchmarkCLIArgs {
	interactive: boolean;
	dependency: string | string[];
	impl: string | string[];
	"sample-size": number;
	horizon: string;
	timeout: number;
	trace: boolean;
	debug: boolean;
	browser: string | string[];
	port: number;
}

type DepName = string;
type Version = string;
type DepVersion = [DepName, Version];
type DependencyGroup = DepVersion[];

/** Config for running benchmarks. Typically parsed from the CLI args */
interface BenchmarkConfig {
	depGroups: DependencyGroup[];
	implementations: string[];
	"sample-size": number;
	horizon: string;
	timeout: number;
	trace: boolean;
	debug: boolean;
	browser: BrowserConfig;
	port: number;
}

interface DependencyConfig {
	path: string;
	scriptsPath?: string;
}

interface BenchmarkAppConfig {
	/** The path to the app directory that contains benchmark HTML files and implementation folders */
	mountPath?: string;
	/** Used to explicitly add additional benchmarks from outside of the mount path */
	benchmarks: {
		[benchId: string]: string;
	};
	implementations: {
		[name: string]: string;
	};
}

interface RootConfig {
	// TODO: What to do about signals which are multiple packages from one repo?
	dependencies: {
		[importSpecifier: string]: {
			[versionId: string]: string | DependencyConfig;
		};
	};
	apps: {
		[appId: string]: BenchmarkAppConfig;
	};
}

interface ImportMap {
	imports: {
		[importSpecifier: string]: string;
	};
	scopes?: {
		[scopePrefix: string]: {
			[importSpecifier: string]: string;
		};
	};
}

/**
 * Expected format of a top-level tachometer JSON config file.
 * @see https://www.npmjs.com/package/tachometer#config-file
 */
type TachConfig = import("tachometer/lib/configfile").ConfigFile;
type TachBenchmarkConfig = Required<TachConfig["benchmarks"][0]>;

/** @see https://www.npmjs.com/package/tachometer#browsers */
type BrowserConfig = Exclude<
	TachBenchmarkConfig["browser"],
	string | undefined
>;

type TachResult = import("tachometer/lib/stats").ResultStatsWithDifferences;
type TachFileResults = import("tachometer/lib/json-output").JsonOutputFile;
type Difference = import("tachometer/lib/stats").Difference;
type ConfidenceInterval = import("tachometer/lib/stats").ConfidenceInterval;
type BrowserInfo = TachResult["result"]["browser"];

/**
 * The values & stats for one variation (implementation + dependencies) of a benchmark
 */
interface VariationResult {
	name: string;
	version: string;
	implementation: string;
	depGroupId: string;
	dependencies: DependencyGroup;
	samples: number[];
	stats: import("tachometer/lib/stats.d.ts").SummaryStats & {
		histogram: string;
	};
	differences: Array<Difference | null>;
}

/**
 * The results of a one measurement from one benchmark. It contains the results
 * of each variation run
 */
interface BenchmarkResult {
	benchName: string;
	browser: BrowserInfo;
	measurement: TachResult["result"]["measurement"];
	variations: VariationResult[];
}

interface Dimension {
	/** The label of the dimension. */
	label: string;
	format: (n: VariationResult) => string;
	tableConfig?: import("table").ColumnUserConfig;
}

declare module "jstat" {
	/** https://jstat.github.io/all.html#jStat.studentt.inv */
	export const studentt: {
		inv(p: number, dof: number): number;
	};

	/** https://jstat.github.io/all.html#randn */
	export function randn(n: number, m: number): [number[]];

	export const normal: {
		/** https://jstat.github.io/all.html#jStat.normal.cdf */
		cdf(x: number, mean: number, stdDev: number): number;
		/** https://jstat.github.io/all.html#jStat.normal.pdf */
		pdf(x: number, mean: number, stdDev: number): number;
		/** https://jstat.github.io/all.html#jStat.normal.inv */
		inv(p: number, mean: number, stdDev: number): number;
	};
}

interface DependencyScripts {
	setup?(): Promise<() => Promise<void>>;
	pin?(): Promise<void>;
}
