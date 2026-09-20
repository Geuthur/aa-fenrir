# Testing Guidelines

When developing and verifying features, refactorings, or bugfixes in this repository, strictly adhere to the following test workflows:

## 1. Backend Python Tests

Always use `make coverage` to test and verify the Python backend code.

- **Command**: `make coverage`
- **Purpose**: Runs the complete test suite against Django / Alliance Auth with coverage tracking and generates coverage reports (`coverage.xml` / `htmlcov/index.html`).
- **Prerequisite**: Ensure the Python virtual environment is active before running (or run in an environment where `/home/testauth/venv/bin/activate` is sourced).

```bash
make coverage
```

## 2. Frontend React Tests

Always use `make react-test` or `npm test` inside `frontend/` to test React code.

- **Command**: `make react-test` (or `cd frontend && npm test`)
- **Linter**: `make react-lint` (or `cd frontend && npm run lint`)
- **Build Verification**: `make react-build` (or `cd frontend && npm run build`)
