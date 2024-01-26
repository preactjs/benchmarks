# Architecture

TODO: Add note about how preact/@preact/signals dependencies installed in `apps` are just for typings and not used at runtime.

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
