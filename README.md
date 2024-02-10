# Preact Benchmarks

A collection of benchmarks for Preact and its ecosystem of libraries.

The `apps` directory contains a bunch of apps that can be benchmarked. Each directory under an `apps` contains HTML files that are the benchmarks for that app. Inside an `apps` folders are implementations of that app using different Preact libraries (e.g. class components, hooks, compat, signals). The `dependencies` directory contains different versions of Preact and its ecosystem libraries. The `cli` directory contains a command line interface to run benchmarks. You can specify using options to the cli for this repository which implementation and dependency version to use for a benchmark.

## Getting started

1. Clone this repository
2. Run `pnpm install`
3. Run `pnpm start` to start the benchmark server

Use the benchmark server to development/modify a benchmark implementation. The server will automatically reload the benchmark when you make changes files.

## Running benchmarks

1. Run `pnpm bench` to run a benchmark
2. Follow the prompts to select which implementation and dependency versions to compare

Run `pnpm bench -- --help` to see all the options available to you.
