#!/usr/bin/env node

import prompts from "prompts";
import { existsSync } from "node:fs";
import { parseArgs } from "node:util";
import { initConfig, runBenchmarks } from "../src/index.js";

async function runInit() {
	const args = parseArgs({
		allowPositionals: true,
		options: {
			configFile: {
				type: "string",
				short: "c",
				default: "preact-bench.config.js",
			},
			preact: {
				type: "string",
			},
			signals: {
				type: "string",
			},
			rts: {
				type: "string",
			},
		},
	});

	const configFile = args.values.configFile;
	if (configFile && existsSync(configFile)) {
		const { overwrite } = await prompts({
			type: "confirm",
			name: "overwrite",
			message: `Config file ${args.values.configFile} already exists. Overwrite?`,
		});
		if (!overwrite) {
			console.log("Aborting.");
			return;
		}
	}

	prompts.override(args.values);
	const options = await prompts([
		{
			type: "text",
			name: "preact",
			message: "Path to local Preact repo:",
		},
		{
			type: "text",
			name: "signals",
			message: "Path to local Preact Signals repo:",
		},
		{
			type: "text",
			name: "rts",
			message: "Path to local Preact render-to-string repo:",
		},
	]);

	await initConfig(args.values.configFile ?? "preact-bench.config.js", {
		localPreactRepoPath: options.preact || undefined,
		localSignalRepoPath: options.signals || undefined,
		localRTSRepoPath: options.rts || undefined,
	});
}

async function main() {
	const command = process.argv[2];
	if (command === "init") {
		await runInit();
	} else {
		await runBenchmarks();
	}
}

main();
