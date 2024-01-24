interface DependencyConfig {
	path: string;
	setup?: string;
	teardown?: string;
}

interface BenchmarkAppConfig {
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
