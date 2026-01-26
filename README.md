# is-it-ready

[![GitHub contributors](https://img.shields.io/github/contributors/MaximSrour/is-it-ready-vscode?style=for-the-badge)](https://github.com/MaximSrour/is-it-ready/graphs/contributors)
[![NPM License](https://img.shields.io/npm/l/is-it-ready?style=for-the-badge)](https://github.com/MaximSrour/is-it-ready-vscode/blob/master/LICENSE)

VS Code extension that runs your project's formatting, linting, tests,
inventory, and security checks in one dashboard.

## Installation

Install from the VS Code Marketplace.

## Usage

- Create a config file in your workspace (see below).
- Open the **Is It Ready** view in the Activity Bar.
- Click a task to run it, or use **Run All Tasks**.

### Commands

- `Is It Ready: Refresh Tasks`
- `Is It Ready: Run All Tasks`
- `Is It Ready: Run Task`
- `Is It Ready: Run Fix`

## Configuration

To get started, you must create a config file in the root directory of your project
(i.e., in the same directory as your `package.json`).

- Supported filenames: `.is-it-ready.config.js`, `.is-it-ready.config.cjs`,
  `.is-it-ready.config.mjs` (CommonJS `module.exports` or ESM `export default`).
- Each file must export an object with a `tasks` array. Every task entry must
  specify the `tool` name and its `command`, and may provide `fixCommand` overrides.

Example `.is-it-ready.config.mjs`:

```js
export default {
  tasks: [
    {
      tool: "Prettier",
      command: "npm run prettier",
      fixCommand: "npm run prettier -- --write",
    },
    {
      tool: "ESLint",
      command: "npm run lint",
    },
  ],
};
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for
detailed guidelines on code standards, testing, and the pull request process.
