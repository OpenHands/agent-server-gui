# Development

This document is for contributors working on `agent-server-gui` itself.

## Recommended local workflow

The default development command is:

```sh
npm run dev
```

This is an alias for `npm run dev:safe`.

It starts a dedicated local `agent-server` for this checkout on `127.0.0.1:18000` and points the frontend at it. It isolates tmux state and conversation persistence by setting separate `TMUX_TMPDIR`, `OH_CONVERSATIONS_PATH`, `OH_BASH_EVENTS_DIR`, and `OH_VSCODE_PORT` values under `.openhands-dev/`, so it does not collide with other local or cloud-backed OpenHands sessions.

Useful overrides:

- `OH_GUI_SAFE_BACKEND_PORT` — backend port for the isolated server (default `18000`)
- `OH_GUI_SAFE_VSCODE_PORT` — VS Code sidecar port (default `backend port + 1`)
- `OH_GUI_SAFE_STATE_DIR` — base directory for isolated server state
- `VITE_WORKING_DIR` — repo root used for new conversations (defaults to the current checkout)

## OpenHands Cloud sandbox warning

If you are editing this repo from an OpenHands Cloud sandbox: **do not point this frontend at the sandbox's existing agent-server**.

Current `agent-server` releases share the default `openhands` tmux socket and `workspace/conversations` persistence directory, so a naive second server in the same sandbox can break the OpenHands conversation that is powering your cloud session (for example with errors like `no server running on /tmp/tmux-*/openhands`).

Use `npm run dev` / `npm run dev:safe` so this repo launches its own isolated backend.

## Alternative development workflows

### Frontend against an existing backend

Use this only if you intentionally started `agent-server` yourself or want the frontend to talk to another backend:

```sh
npm run dev:frontend
```

The frontend-only workflow expects the backend at `127.0.0.1:8000` by default.

If you start the backend with `SESSION_API_KEY` or `OH_SESSION_API_KEYS_0`, every `/api/*` route is authenticated with `X-Session-API-Key`. In that case the frontend must send the same key via `VITE_SESSION_API_KEY`.

### Mock mode

If you want to run the frontend without a live backend, use:

```sh
npm run dev:mock
# or
npm run dev:mock:saas
```

## Build and test

```sh
npm run test
npm run build
npm run start
```

Useful targeted verification for the isolated dev launcher:

```sh
npm run test -- __tests__/api/agent-server-config.test.ts __tests__/scripts/dev-safe.test.ts
```

## Environment variables

You can create a `.env` file in the project directory with these variables based on `.env.sample`.

| Variable                    | Description                                                                        | Default Value          |
| --------------------------- | ---------------------------------------------------------------------------------- | ---------------------- |
| `VITE_BACKEND_BASE_URL`     | Full base URL for the agent server used by direct browser requests                 | current browser origin |
| `VITE_BACKEND_HOST`         | Backend host used by the Vite dev proxy                                            | `127.0.0.1:8000`       |
| `VITE_SESSION_API_KEY`      | Optional `X-Session-API-Key` header value for authenticated agent_server instances | -                      |
| `VITE_WORKING_DIR`          | Workspace path sent when starting new conversations                                | `/workspace/project`   |
| `VITE_WORKER_URLS`          | Optional comma-separated worker/app URLs for the Browser tab                       | -                      |
| `VITE_ENABLE_BROWSER_TOOLS` | Set to `false` to omit `BrowserToolSet` from new conversation payloads             | `true`                 |
| `VITE_MOCK_API`             | Enable/disable API mocking with MSW                                                | `false`                |
| `VITE_MOCK_SAAS`            | Simulate SaaS mode in development                                                  | `false`                |
| `VITE_USE_TLS`              | Use HTTPS/WSS for the Vite proxy target                                            | `false`                |
| `VITE_FRONTEND_PORT`        | Port to run the frontend application                                               | `3001`                 |
| `VITE_INSECURE_SKIP_VERIFY` | Skip TLS certificate verification for proxied backend requests                     | `false`                |
| `VITE_GITHUB_TOKEN`         | GitHub token for repository access (used in some tests)                            | -                      |
