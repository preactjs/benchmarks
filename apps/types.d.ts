interface Window {
	/** Manually trigger a major garbage collection. Only available in Chromium-based browsers with the --expose-gc flag */
	gc?(): void;

	usedJSHeapSize?: number;
	configData?: BenchmarkURLConfig;
}

interface PerformanceMemory {
	usedJSHeapSize: number;
}

interface Performance {
	memory?: PerformanceMemory;
}

interface BenchmarkURLConfig extends RootConfig {}
