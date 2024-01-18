interface Dependency {
	path: string;
	setup?: string;
	teardown?: string;
}

interface BenchmarkApp {
	benchmarks: {
		[benchId: string]: string;
	};
	implementations: {
		[name: string]: string;
	};
}

interface CLIConfig {
	// TODO: What to do about signals which are multiple packages from one repo?
	dependencies: {
		[importSpecifier: string]: {
			[versionId: string]: string | Dependency;
		};
	};
	apps: {
		[appId: string]: BenchmarkApp;
	};
}
