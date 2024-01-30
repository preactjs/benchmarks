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
}

interface BenchmarkActionConfig {
	depGroups: string[][];
	implementations: string[];
	"sample-size": number;
	horizon: string;
	timeout: number;
	trace: boolean;
	debug: boolean;
	browser: string[];
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
