#!/usr/bin/env node

import inquirer from "inquirer";
import sade from "sade";
import { runBenchServer, runBenchmarks } from "../src/index.js";
import { getAppConfig, getDepConfig } from "../src/config.js";
import {
	ensureArray,
	makeDepVersion,
	parseDepVersion,
	versionSep,
} from "../src/utils.js";

const prompts = inquirer.createPromptModule();

const IS_CI = process.env.CI === "true";
const defaultBenchOptions = {
	interactive: false,
	dependency: "latest",
	impl: "preact-class",
	// Tachometer default is 50, but locally let's only do 25
	"sample-size": !IS_CI ? 25 : 50,
	// Tachometer default is 10% but let's do 5% to save some GitHub action
	// minutes by reducing the likelihood of needing auto-sampling. See
	// https://github.com/Polymer/tachometer#auto-sampling
	horizon: "5%",
	// Tachometer default is 3 minutes, but let's shrink it to 1 here to save some
	// GitHub Action minutes
	timeout: 1,
	trace: false,
	debug: false,
	browser: "chrome-headless",
	port: 5173,
};

async function promptBenchmarkFile() {
	const appConfig = await getAppConfig(true);

	const { benchmarkFilePath } = await prompts([
		{
			type: "list",
			name: "benchmarkFilePath",
			message: "Which app do you want to benchmark?",
			validate(input) {
				return input ? true : "You must select an app";
			},
			choices: Object.entries(appConfig).flatMap(
				([appName, { benchmarks }]) => {
					return Object.keys(benchmarks).map((benchmarkName) => {
						const benchmarkFile = `${appName}/${benchmarkName}`;
						return { title: benchmarkFile, value: benchmarkFile };
					});
				},
			),
		},
	]);

	return `apps/${benchmarkFilePath}`;
}

/** @type {(benchmarkFile: string) => Promise<string | string[]>} */
async function promptImpl(benchmarkFile) {
	const appConfig = await getAppConfig(true);
	const appName = benchmarkFile.split("/")[1];

	const { impl } = await prompts([
		{
			type: "checkbox",
			name: "impl",
			message: "Which implementation do you want to benchmark?",
			validate(input) {
				return input.length
					? true
					: "You must select at least one implementation";
			},
			choices: Object.keys(appConfig[appName].implementations).map(
				(implName) => {
					return { title: implName, value: implName };
				},
			),
		},
	]);

	return impl.length === 1 ? impl[0] : impl;
}

/** @type {() => Promise<string[]>} */
async function promptDependency() {
	const depConfig = await getDepConfig(true);

	/** @type {string[][]} */
	const depGroups = [];
	let i = 1;

	/** @type {(input: string[]) => Promise<string | boolean>} */
	async function validate(input) {
		if (input.length == 0) {
			if (depGroups.length < 2) {
				return `Select at least two groups of dependencies to run. This is group ${i}.`;
			} else {
				return true;
			}
		}

		const answers = input;
		const depNames = Object.keys(depConfig);
		for (let depName of depNames) {
			const matchingAns = answers.filter((a) =>
				a.startsWith(depName + versionSep),
			);

			if (matchingAns.length > 1) {
				const selectedVersions = matchingAns
					.map((a) => parseDepVersion(a)[1])
					.join('", "');

				return `Only one version of "${depName}" can be selected. "${selectedVersions}" was selected.`;
			}
		}

		return true;
	}

	while (true) {
		/** @type {{ dependencies: string[] }} */
		const { dependencies } = await prompts([
			{
				type: "checkbox",
				name: "dependencies",
				message: `Which set of dependencies to include in group ${i}?`,
				suffix: `\n   (Select none to stop adding dependency groups)\n   (Select up to one per group)\n  `,
				pageSize: 10,
				validate,
				choices: Object.entries(depConfig).flatMap(([depName, versionsObj]) => {
					/** @type {any[]} */
					const choices = [new inquirer.Separator(depName)];
					return choices.concat(
						Object.keys(versionsObj).map((version) => {
							const depVersion = makeDepVersion(depName, version);
							return { title: depVersion, value: depVersion };
						}),
					);
				}),
			},
		]);

		if (!dependencies || dependencies.length === 0) {
			break;
		}

		i++;
		depGroups.push(dependencies);
	}

	return depGroups.map((group) => group.join(","));
}

/** @type {(benchmarkFile: string, args: BenchmarkCLIArgs) => void} */
function logBenchCommand(benchmarkFile, args) {
	/** @type {Array<string | number>} */
	let cli = ["preact-bench", "bench"];
	if (benchmarkFile) {
		cli.push(benchmarkFile);
	}

	if (args.interactive !== defaultBenchOptions.interactive) {
		cli.push("--interactive");
	}

	if (args.impl !== defaultBenchOptions.impl) {
		if (Array.isArray(args.impl)) {
			args.impl.forEach((impl) => {
				cli.push("-i");
				cli.push(impl);
			});
		} else {
			cli.push("-i");
			cli.push(args.impl);
		}
	}

	if (args.dependency !== defaultBenchOptions.dependency) {
		if (Array.isArray(args.dependency)) {
			args.dependency.forEach((depGroup) => {
				cli.push("-d");
				cli.push(depGroup);
			});
		} else {
			cli.push("-d");
			cli.push(args.dependency);
		}
	}

	if (args["sample-size"] !== defaultBenchOptions["sample-size"]) {
		cli.push("-n");
		cli.push(args["sample-size"]);
	}

	if (args.horizon !== defaultBenchOptions.horizon) {
		cli.push("-h");
		cli.push(args.horizon);
	}

	if (args.timeout !== defaultBenchOptions.timeout) {
		cli.push("-t");
		cli.push(args.timeout);
	}

	if (args.trace !== defaultBenchOptions.trace) {
		cli.push("--trace");
	}

	if (args.debug !== defaultBenchOptions.debug) {
		cli.push("--debug");
	}

	if (args.browser !== defaultBenchOptions.browser) {
		if (Array.isArray(args.browser)) {
			args.browser.forEach((browser) => {
				cli.push("-b");
				cli.push(browser);
			});
		} else {
			cli.push("-b");
			cli.push(args.browser);
		}
	}

	console.log("\n" + "=".repeat(40));
	console.log("To run this benchmark again, run:");
	console.log(cli.join(" "));
	console.log("=".repeat(40) + "\n");
}

/**
 * @param {string} str
 * @returns {BrowserConfig}
 */
function parseBrowserArg(str) {
	// Source: https://github.com/Polymer/tachometer/blob/d4d5116acb2d7df18035ddc36f0a3a1730841a23/src/browser.ts#L100
	let remoteUrl;
	const at = str.indexOf("@");
	if (at !== -1) {
		remoteUrl = str.substring(at + 1);
		str = str.substring(0, at);
	}
	const headless = str.endsWith("-headless");
	if (headless === true) {
		str = str.replace(/-headless$/, "");
	}

	/** @type {import('tachometer/lib/browser').BrowserName} */
	// @ts-ignore
	const name = str;

	/** @type {BrowserConfig} */
	const config = { name, headless };
	if (remoteUrl !== undefined) {
		config.remoteUrl = remoteUrl;
	}

	// Custom browser options
	if (config.name == "chrome") {
		config.addArguments = [
			"--js-flags=--expose-gc",
			"--enable-precise-memory-info",
		];
	}

	return config;
}

/** @type {(args: BenchmarkCLIArgs) => BenchmarkConfig} */
function parseBenchmarkCLIArgs(args) {
	const selectedBrowser = Array.isArray(args.browser)
		? args.browser.at(-1) ?? defaultBenchOptions.browser
		: args.browser;

	return {
		...args,
		depGroups: ensureArray(args.dependency)
			.map((depGroup) => depGroup.split(","))
			.map((depGroup) => depGroup.map((dep) => parseDepVersion(dep))),
		implementations: ensureArray(args.impl),
		browser: parseBrowserArg(selectedBrowser),
	};
}

/** @type {(benchmarkFile: string, args: BenchmarkCLIArgs) => Promise<void>} */
async function benchAction(benchmarkFile, args) {
	if (
		args.interactive ||
		!benchmarkFile ||
		(!Array.isArray(args.dependency) && !Array.isArray(args.impl))
	) {
		if (!benchmarkFile) {
			benchmarkFile = await promptBenchmarkFile();
		}

		if (!Array.isArray(args.dependency) && !Array.isArray(args.impl)) {
			args.impl = await promptImpl(benchmarkFile);
			args.dependency = await promptDependency();
		}

		logBenchCommand(benchmarkFile, args);
	}

	const benchConfig = parseBenchmarkCLIArgs(args);
	await runBenchmarks(benchmarkFile, benchConfig);
}

const prog = sade("preact-bench").version("0.0.0");

prog
	.command("bench [benchmark_file]")
	.describe(
		"Run the given benchmark using the specified implementation with the specified dependencies. If no benchmark file, no dependencies, or no implementations are specified, will prompt for one.",
	)
	.example("bench")
	.example("bench apps/todo/todo.html")
	.example("bench apps/todo/todo.html -d preact@local -d preact@latest")
	.example(
		"bench apps/todo/todo.html -d preact@local -d preact@main -i preact-hooks",
	)
	.example(
		"bench apps/todo/todo.html -d preact@local,signals@local -d preact@main,signals@local -i preact-signals -n 2 -t 0",
	)
	.example("bench apps/todo/todo.html -d preact@local -d preact@main --trace")
	.option(
		"--interactive",
		"Prompt for options. Defaults to true of no benchmark file, dependencies, or implementations are specified",
		defaultBenchOptions.interactive,
	)
	.option(
		"-d, --dependency",
		"What group of dependencies (comma-delimited) and version to use for a run of the benchmark (package@version)",
		defaultBenchOptions.dependency,
	)
	.option(
		"-i, --impl",
		"What implementation of the benchmark to run",
		defaultBenchOptions.impl,
	)
	.option(
		"-n, --sample-size",
		"Minimum number of times to run each benchmark",
		defaultBenchOptions["sample-size"],
	)
	.option(
		"-h, --horizon",
		'The degrees of difference to try and resolve when auto-sampling ("N%" or "Nms", comma-delimited)',
		defaultBenchOptions.horizon,
	)
	.option(
		"-t, --timeout",
		"Maximum number of minutes to spend auto-sampling",
		defaultBenchOptions.timeout,
	)
	.option(
		"--trace",
		"Enable performance tracing (Chrome only)",
		defaultBenchOptions.trace,
	)
	.option("--debug", "Enable debug logging", defaultBenchOptions.debug)
	.option(
		"-b, --browser",
		"Which browser to run the benchmarks in: chrome, chrome-headless, firefox, firefox-headless, safari, edge",
		defaultBenchOptions.browser,
	)
	.option(
		"-p, --port",
		"What port to run the benchmark server on",
		defaultBenchOptions.port,
	)
	.action(benchAction);

prog
	.command("dev")
	.describe("Run dev server")
	.option(
		"-p, --port",
		"What port to run the benchmark server on",
		defaultBenchOptions.port,
	)
	.action((args) => runBenchServer(true, args.port));

prog.parse(process.argv);
