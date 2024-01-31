interface BenchmarkCLIOpts {
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
type DependencyTuple = [DepName, Version];
type DependencyGroup = DependencyTuple[];

interface BenchmarkActionConfig {
	depGroups: DependencyGroup[];
	implementations: string[];
	"sample-size": number;
	horizon: string;
	timeout: number;
	trace: boolean;
	debug: boolean;
	browser: string;
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
