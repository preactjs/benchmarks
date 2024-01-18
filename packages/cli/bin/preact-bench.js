#!/usr/bin/env node

import { parseArgs } from "node:util";
import { runBenchmarks } from "../src/index.js";

const args = parseArgs({});
console.log(args);

await runBenchmarks();
