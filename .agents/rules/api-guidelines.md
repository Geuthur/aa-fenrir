# API & OpenAPI Guidelines

When working on backend communication and frontend API integration in this repository, strictly adhere to the following rules:

## 1. Always use `openapi-fetch` (Never `axios` for API calls)

- All API requests to backend endpoints must use `openapi-fetch` (`apiClient` exported from `@/Api/Api`).
- Do **not** use `axios` for API calls or endpoints. `apiClient` already handles CSRF tokens (`X-CSRFToken`), credentials, base URLs, and TypeScript types.

## 2. OpenAPI Generation via `make react-openapi` (Never Edit `OpenApi.ts` Manually)

- **NEVER manually edit `frontend/src/Api/OpenApi.ts`!** Direct changes to this file are strictly forbidden.
- `OpenApi.ts` must always be generated automatically via:
  ```bash
  make react-openapi
  ```
  (Ensure `VIRTUAL_ENV` is set, e.g. `VIRTUAL_ENV=/home/testauth/venv make react-openapi`).
- **CRITICAL**: Before running `make react-openapi`, if any changes were made to `aafenrir/api/schema.py`, models, or API endpoints, the test server **MUST** first be restarted using:
  ```bash
  make restart-test-server
  ```
  Only after the server has restarted with the new schemas should `make react-openapi` be executed to export the updated OpenAPI schema (`frontend/src/openapi.json`) and generate the TypeScript types in `frontend/src/Api/OpenApi.ts`.
- Alternatively, `make react-export-openapi` exports only the schema, and `npm run generate-api` (inside `frontend/`) generates only the TypeScript types from `openapi.json`.
