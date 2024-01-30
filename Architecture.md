# Architecture

> For an early discussion of goals and outcomes we wanted from this repo, see
> <https://github.com/preactjs/benchmarks/discussions/1>

## Concepts

There are 4 main organizational concepts used in this repo:

| Concept        | Description                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| App            | A single page app that supports operations to be benchmarked (e.g. a TODO app, `/apps/todo` folder)                             |
| Benchmark      | An HTML file that renders an app and measures a specific operation of that app (e.g. adding a new todo, `/apps/todo/todo.html`) |
| Implementation | An implementation of an app (e.g. Preact with class components or Preact using hooks, `/apps/todo/preact-class`)                |
| Dependency     | A dependency of an implementation (e.g. latest Preact version, `/dependencies/preact/latest`)                                   |

### Apps, benchmarks, and implementations

An app is a collection of benchmarks and implementations in the `<repo root>/apps` directory. For example, the `table-app` directory refers to the application that the `js-framework-benchmark` repo uses to measure the performance of various JavaScript frameworks.

Inside the `table-app` directory we have implemented a couple different benchmarks that measure different operations or aspects of that app. For example, the `replace1k.html` benchmark measures the time it takes to replace 1,000 rows in the table. The `hydrate1k.html` benchmark measures the time it takes to hydrate 1,000 rows in the table.

For this app, there are also a couple different implementations of that app that we can measure:

- `preact-class` uses Preact class components
- `preact-hooks` uses Preact hooks.
- `preact-compat` uses Preact's compatibility layer
- `preact-signals` implements the same app using `@preact/signals`

The pattern described here is used for all apps in the `apps` directory. The folders inside of an app's directory typically are named after the implementation they contain. HTML files within in the app's directory contain the code to load and measure an operation on implementation of that app.

### Dependencies

Each app is implemented using a JS framework (namely Preact or one of our ecosystem libraries). It is useful to be able to measure and compare how different versions of a framework perform. For example, we might want to compare how Preact v10.5.0 performs compared to Preact v10.6.0. Or how a change in my local repository of Preact performs compared to the latest version of Preact.

All of the dependencies we support comparing are in the `<repo root>/dependencies` directory. Each dependency has a directory named after the dependency (and scoped dependencies are nested so `@preact/signals` will be in the `dependencies/@preact/signals` folder). Inside that directory are directories for each version of that dependency that we support. For example, the `preact` directory contains a `local` directory that will load code from a local clone of Preact repository. It also contains a `latest` directory that contains the latest version of Preact from NPM.

Inside these directories are the files that are needed to load that dependency. For example, the `local` directory contains scripts to setup loading from a local Preact repository. The `latest` directory contains a `package.json` file that points to the latest version of Preact on NPM. Inside these "proxy packages" you can implement code to massage over minor API differences that may exist between differences versions. For example, in the Preact versions we expose a `createRoot` API that wraps Preact to normalize over API differences between Preact versions.

## Benchmark server

In order to actually run benchmarks, we need a server to serve the benchmark HTML files. We use Vite as this server, customized to support our needs.

The benchmark server is a web server that serves the benchmark apps and the implementations of those apps. It also serves the dependencies that the implementations use. The benchmark server is responsible for mapping the `impl` and `dep` query parameters to the correct implementation and dependency version.

> TODO: What should implementations import from? Different versions of a library
> might have different exported APIs so they need to import a package that has
> specific version of API. What if we define a common API that neither package
> supports? We could do `declare module "preact"` in apps, but is it useful to
> duplicate the preact TS types in the benchmark apps? We could install a version
> of the libraries in apps/ to then import the types from?
>
> Perhaps we should just align to the latest API of the library and everything
> else must conform to that API if possible.

## Decisions

- Q: Use Tach's web server or Vite
  - Requires a web server with the right middleware either way to support mapping "implementation" import to the correct implementation
  - A: Vite
    - Pro: supports JSX & TSX out of the box
    - Pro: Can customize dev experience more
      - e.g. load an initial html page to pick a configuration
    - Con: Requires running a separate web server
    - Unknown: Does Vite's module resolution handle nested `node_modules` with different package versions? Tach does this by creating temporary npm install directories for each version.
  - Tach
    - Pro: self-contained off-the-shelf
    - Con: requires authoring using browser supported syntax
    - Con: Have to mentally map ports to implementation/version
- Q: Should benchmark apps be in the same package as CLI or in separate packages?
  - A: Probably a separate package since where to find apps is customizable via the CLI config
- Q: How to extend the available implementations & versions from another repository?
  - A: Support a CLI config file extends/overrides what implementations & versions are available
- Q: How do implementations specify default versions & versions specify default implementations?
  - A: CLI config can specify a default version for a dependency. Perhaps dependencies won't specify a default implementation anymore
- Q: Where do version override packages live?
  - A: Any resolvable npm package (so local or NPM)?

## CLI ideas

- https://github.com/preactjs/benchmarks/discussions/1
- `list` or `ls` command to list available dependency versions, and apps & implementations
- Use `prompts` with `prompts.overrides` to provide an easier CLI experience
- `--config` option to specify server config file for finding implementations & versions
- Run Vite server in CLI process?
- Should there be a "build-all" option to build a GH deployable version of all apps? Would probably be difficult as I'd need to build out versions of each implementation for each version that is deployable

## Running in other repos

- Consider exporting a function generate a "dependencies" config from the "@preact/benchmark-deps" package that takes in the paths to the relevant local repos
- Then in each repo, a "prepare" step in the benches package.json script would run the function and write the config to a file in the benches directory. The local config will be ignored by Git and so can be customized with local file paths.

Or

TODO: Make decision about git submodule or not

- Should I just simplify this and use Git submodules? Which allows local branching and editing? And removes the need for a CLI config since we can assume more things about the repo structure.
- ??? But how do I configure local repos for Preact & Signals & render-to-string?

## Vite server

- Middleware maps `impl` parameter to the correct implementation `index.js`:
  - ```html
    <script type="module">
    	const implParam = new URLSearchParams(location.search).get("impl");
    	const implementation = import("./" + implParam + "/index.js");
    </script>
    ```
- Middleware maps any requests for specified `dep` parameters to the dependency version's directory

## Folder structure

```txt
- packages/
	- dependencies/
		- preact/
			- local/
			- master/
		- signals/
			- local/
			- master/
		- ...
	- cli/
	- apps/
		- table-app/
			- _shared/
			- preact-class/
			- preact-hooks/
			- preact-compat/
			- ...
			- 02_replace1k.html
			- 03_update1k10k.html
		- movie-app/ ...
		- todo/ ...
		- filter-list/ ...
```
