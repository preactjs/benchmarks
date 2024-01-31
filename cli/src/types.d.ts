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
	setup?: string;
	teardown?: string;
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

type TachResults = import("tachometer/lib/stats").ResultStatsWithDifferences[];
type TachFileResults = import("tachometer/lib/json-output").JsonOutputFile;
