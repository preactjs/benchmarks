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

Run `pnpm bench --help` to see all available options.

```text
$ pnpm bench --help

  Description
    Run the given benchmark using the specified implementation with the specified dependencies.
    If no benchmark file, no dependencies, or no implementations are specified, will prompt for one.

  Usage
    $ preact-bench bench [benchmark_file] [options]

  Options
    --interactive        Prompt for options. Defaults to true of no benchmark file,
		                     dependencies, or implementations are specified  (default false)
    -d, --dependency     What group of dependencies (comma-delimited) and version to
		                     use for a run of the benchmark (package@version)  (default latest)
    -i, --impl           What implementation of the benchmark to run  (default preact-class)
    -n, --sample-size    Minimum number of times to run each benchmark  (default 25)
    -h, --horizon        The degrees of difference to try and resolve when auto-sampling
		                     ("N%" or "Nms", comma-delimited)  (default 5%)
    -t, --timeout        Maximum number of minutes to spend auto-sampling  (default 1)
    --trace              Enable performance tracing (Chrome only)  (default false)
    --debug              Enable debug logging  (default false)
    -b, --browser        Which browser to run the benchmarks in: chrome, chrome-headless,
		                     firefox, firefox-headless, safari, edge  (default chrome-headless)
    -p, --port           What port to run the benchmark server on  (default 5173)
    -h, --help           Displays this message

  Examples
    $ preact-bench bench
    $ preact-bench bench apps/todo/todo.html
    $ preact-bench bench apps/todo/todo.html -d preact@local -d preact@latest
    $ preact-bench bench apps/todo/todo.html -d preact@local -d preact@main -i preact-hooks
    $ preact-bench bench apps/todo/todo.html -d preact@local,signals@local -d preact@main,signals@local -i preact-signals -n 2 -t 0
    $ preact-bench bench apps/todo/todo.html -d preact@local -d preact@main --trace
```

## Benchmarking within another repository

This repository is intended to be included as a submodule in another repository. This allows you to run benchmarks against local changes in that repository. The `dev` script in this repository starts a benchmarking dev server that is useful when benchmarking changes in another repository.

```
$ pnpm dev --help

Description
    Run a dev server to interactively run a benchmark while developing changes

  Usage
    $ preact-bench dev [benchmark_file] [options]

  Options
    --interactive        Prompt for options  (default false)
    -d, --dependency     What group of dependencies (comma-delimited) and version to
		                     use for a run of the benchmark (package@version)  (default latest)
    -i, --impl           What implementation of the benchmark to run  (default preact-class)
    -n, --sample-size    Minimum number of times to run each benchmark  (default 25)
    -h, --horizon        The degrees of difference to try and resolve when auto-sampling
		                     ("N%" or "Nms", comma-delimited)  (default 5%)
    -t, --timeout        Maximum number of minutes to spend auto-sampling  (default 1)
    --trace              Enable performance tracing (Chrome only)  (default false)
    --debug              Enable debug logging  (default false)
    -b, --browser        Which browser to run the benchmarks in: chrome, chrome-headless,
		                     firefox, firefox-headless, safari, edge  (default chrome-headless)
    -p, --port           What port to run the benchmark server on  (default 5173)
    -h, --help           Displays this message

  Examples
    $ preact-bench dev apps/todo/todo.html -d preact@local -d preact@main -i preact-hooks
    $ preact-bench dev apps/todo/todo.html -d preact@local -d preact@local-pinned -i preact-hooks
```

This command shares the same options as the `bench` command. Once you start the server you can press `b⏎` to re-build your local Preact repository (or whatever repository this is within) and re-run the configured benchmarks.

```text
$ pnpm dev apps/many-updates/many-updates.html -i preact -d preact@local -d preact@local-pinned -n 2 -t 0

> @preact/benchmarks@0.0.1 dev /Users/andre_wiggins/github/preactjs/preact-v10/benchmarks
> node cli/bin/preact-bench.js dev "apps/many-updates/many-updates.html" "-i" "preact" "-d" "preact@local" "-d" "preact@local-pinned" "-n" "2" "-t" "0"

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press p + enter Pin current local changes into local-pinned
  ➜  press b + enter run Benchmarks
  ➜  press h + enter show help

```

You can also press the `p⏎` key to build your local repos changes and copy them into the relevant `local-pinned` directory. This command is useful when you want to compare different local changes against each other.
