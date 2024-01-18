#!/usr/bin/env node

import prompts from "prompts";
import { existsSync } from "node:fs";
import { parseArgs } from "node:util";
import sade from "sade";
import { initConfig, runBenchmarks } from "../src/index.js";

const prog = sade("preact-bench").version("0.0.0");

prog
	.command("init")
	.describe("Initialize a config file")
	.option("--configFile -c", "Path to config file", "preact-bench.config.js")
	.option("--preact", "Path to local Preact repo")
	.option("--signals", "Path to local Preact Signals repo")
	.option("--rts", "Path to local Preact render-to-string repo")
	.option("--force -f", "Overwrite existing config file", false)
	.action(async (args) => {
		/** @type {string} */
		const configFile = args.configFile;
		if (args.force == false && existsSync(configFile)) {
			const { overwrite } = await prompts({
				type: "confirm",
				name: "overwrite",
				message: `Config file "${configFile}" already exists. Overwrite?`,
			});
			if (!overwrite) {
				console.log("Aborting.");
				return;
			}
		}

		prompts.override(args);
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

		await initConfig(configFile, {
			localPreactRepoPath: options.preact || undefined,
			localSignalRepoPath: options.signals || undefined,
			localRTSRepoPath: options.rts || undefined,
		});
	});

prog.command("bench").describe("Run benchmarks").action(runBenchmarks);

prog.parse(process.argv);
