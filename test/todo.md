# Tests

## Vite Index page

- Changing `app` updates `benchmarks` & `implementations`
- Changing `app` or `benchmark` updates form action
- Form state is saved & restored after submitting
- From submissions creates expected URL

## Vite Benchmark page

- Benchmark page renders correctly
  - When all deps are specified
  - When some deps are specified
- Correct implementation loads when specified
- Correct code is loaded when deps are specified
- HMR does not load when in benchmark mode

## CLI

- Benchmark command runs without errors
- `signals@version` shortcut works
