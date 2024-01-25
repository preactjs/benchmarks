#!/usr/bin/env node

import sade from "sade";
import { runBenchmarks, runDevServer } from "../src/index.js";

const prog = sade("preact-bench").version("0.0.0");

prog.command("bench").describe("Run benchmarks").action(runBenchmarks);

prog.command("dev").describe("Run dev server").action(runDevServer);

prog.parse(process.argv);
