# Contributing to SysProbe Pro

First off, thank you for considering contributing to SysProbe Pro! It's people like you that make this tool great.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. We expect all contributors to maintain a welcoming and inclusive environment.

## How Can I Contribute?

### Reporting Bugs
- Ensure the bug was not already reported by searching on GitHub under Issues.
- If you're unable to find an open issue addressing the problem, open a new one. Be sure to include a title and clear description, as much relevant information as possible, and a code sample or an executable test case demonstrating the expected behavior that is not occurring.

### Suggesting Enhancements
- Open a new issue with the label `enhancement`.
- Provide a clear and detailed explanation of the feature you want and why it's important.

### Pull Requests
1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. Ensure the test suite passes.
4. Make sure your code adheres to the existing style (we use Prettier and ESLint).
5. Issue that pull request!

## Architecture Overview
SysProbe Pro is built purely with native Node.js libraries and minimalistic dependencies (like `chalk` and `commander`). 

- **src/cli.js**: The entry point router.
- **src/dashboard/**: Full-screen terminal dashboard logic.
- **src/monitor/**: Legacy live monitoring panel.
- **src/analyzers/**: Static analysis logic for `scan` command.
- **src/advisor/**: Knowledge engine heuristics for `ai` command.
- **src/services/**: Core data fetching layer.
- **src/reports/**: Multi-format generation (`report` command).

Keep all business logic out of the CLI routing layer. Add your logic to specific service modules.

Thank you!
