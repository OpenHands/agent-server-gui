# Repository Notes

- This repository is a near-direct port of the OpenHands frontend, adapted to talk straight to `software-agent-sdk` / `agent_server` without the usual OpenHands app backend.
- Frontend API adaptation lives mainly in `src/api/`:
  - `option-service` fabricates an OSS web-client config and reads models/providers from `agent_server` LLM endpoints.
  - `settings-service` stores settings locally in browser localStorage and reads schemas from `agent_server` `/api/settings/*` endpoints.
  - `v1-conversation-service`, `event-service`, `sandbox-service`, `git-service`, and `skills-service` are mapped directly to `agent_server` REST endpoints.
  - `open-hands-axios` injects the optional `X-Session-API-Key` from env/local config for all requests.
- Supported env vars for deployment:
  - `VITE_BACKEND_BASE_URL` for the agent server base URL.
  - `VITE_SESSION_API_KEY` for optional session auth.
  - `VITE_WORKING_DIR` for the default workspace path sent when starting conversations.
  - `VITE_WORKER_URLS` as a comma-separated list of browser worker URLs if you want the Browser tab to probe exposed app hosts.
  - `VITE_ENABLE_BROWSER_TOOLS=false` to omit `BrowserToolSet` from new conversation payloads.
- The UI keeps most OpenHands routes/layout intact, but SaaS/org/billing/integration behavior is intentionally hidden or stubbed via the fabricated OSS config because there is no separate app backend.
- Verification command: `npm run typecheck && npm run build`.
- `@openhands/typescript-client` is currently consumed via a vendored local file dependency at `vendor/openhands-typescript-client` because anonymous/public GitHub Packages install was not usable in this environment. The vendored package is pinned to `v0.1.2`, keeps built `dist/` output committed, and exposes extra subpath exports for `client/http-client`, `events/remote-events-list`, and `workspace/remote-workspace`.
- Shared TypeScript-client adapters live in `src/api/typescript-client.ts`; prefer those helpers for agent-server-backed REST/workspace/event/VS Code calls before falling back to `open-hands-axios`.
- In this repo state, `src/api/typescript-client.ts` imports the vendored TypeScript client directly from `vendor/openhands-typescript-client/src/*` rather than the package subpath exports, because the file dependency does not currently ship the expected built `dist/` subpath files in this environment.
- Root `tsconfig.json` excludes `vendor/openhands-typescript-client` so the frontend typecheck only covers the app code.

- `npm run dev:mock` needs MSW handlers for the direct agent-server routes used by the adapted frontend, not the original OpenHands mock paths. Key routes that must stay covered are:
  - bootstrap/model loading: `/server_info`, `/api/llm/models/verified`, `/api/llm/providers`
  - settings schemas: `/api/settings/agent-schema`, `/api/settings/conversation-schema`
  - conversation browsing/loading: `/api/conversations/search`, `/api/conversations?ids=...`, `/api/conversations/:id`, `/api/conversations/:id/events/*`
  - runtime git panels: `/api/git/changes`, `/api/git/diff`
- Frontend compatibility guard: `OptionService.getConfig()` now uses `/server_info.version` to block unsupported agent-server versions before the app loads. Git history in `software-agent-sdk` shows `/api/settings/agent-schema` and `/api/settings/conversation-schema` first shipped in tag `v1.17.0`, so the GUI currently treats `< 1.17.0` (or unknown/unparseable versions) as incompatible, `useConfig` stops retrying that case, and `src/root.tsx` renders a blocking unsupported-version notice on every route.
- Useful regression tests for mock mode live in `__tests__/api/option-service.test.ts`, `__tests__/api/mock-conversation-handlers.test.ts`, and `__tests__/api/mock-settings-handlers.test.ts`.
- Browser-verified mock-mode tour artifact was generated at `artifacts/frontend-tour.gif`.
- Live `agent_server` compatibility quirks discovered during browser verification:
  - Latest `openhands-agent-server` live-mode notes (verified against 1.18.1):
    - `/api/settings/agent-schema` and `/api/settings/conversation-schema` exist on recent servers, but they return `401` when the server was started with `SESSION_API_KEY` or `OH_SESSION_API_KEYS_0`; the frontend must send the same value as `VITE_SESSION_API_KEY` / `X-Session-API-Key`.
    - The provider/model picker should use `/api/llm/providers`, `/api/llm/models`, and `/api/llm/models/verified`; `/api/v1/config/providers/search` and `/api/v1/config/models/search` 404 on current live agent-server releases.
    - When the browser is accessing the frontend through a remote host (for example an All Hands work URL) but `VITE_BACKEND_BASE_URL` points at `127.0.0.1`/`localhost`, browser-side REST calls must fall back to the frontend origin so Vite can proxy `/api` and `/sockets` to the local backend.
  - `GET /api/conversations` expects repeated `ids` params (`?ids=a&ids=b`), not Axios's default bracket form (`ids[]=a`), so the shared Axios client needs a custom params serializer.
  - Runtime git panels should prefer the conversation's reported `workspace.working_dir` when present; falling back to `/workspace/project` can produce 500s like `Not a git repository` for direct local workspaces such as `/workspace/project/agent-server-gui`.
  - For the current `openhands-agent-server` PyPI/uv-tool flow, `uv tool install -U openhands-agent-server` alone was not sufficient in this environment. A working install was:
    - `uv tool install -U --with openhands-tools --with openhands-workspace --with libtmux openhands-agent-server`
    - `uv tool install` exposes the executable as `agent-server`, not `openhands-agent-server`, and may require adding `~/.local/bin` to `PATH`.
  - Current SDK / agent-server conversation start payloads must use SDK-registered snake_case tool names, not the old class-style names. Working names against SDK v1.18.1 were:
    - `terminal`
    - `file_editor`
    - `task_tracker`
    - `browser_tool_set`
      Using `TerminalTool` / `FileEditorTool` / `TaskTrackerTool` / `BrowserToolSet` caused live `/api/conversations/{id}/events` runs to fail with `ToolDefinition '<name>' is not registered`.
  - For local verification in this repo, setting `VITE_WORKING_DIR=/workspace/project/agent-server-gui` avoids initial Changes-tab 500s from pointing conversations at the non-repo parent `/workspace/project`.
  - A successful end-to-end live run in this environment required a real LLM config (`LLM_MODEL` + `LLM_API_KEY`). The default `litellm_proxy/...` model with no `llm_api_key` failed at runtime with a `litellm.AuthenticationError`.

- README expectation: the very first section should be a concrete from-scratch quickstart for running this frontend against a real `openhands-agent-server` (clone, install backend, optional `.env`, run `npm run dev`). Keep live-backend instructions ahead of general project overview.
- As an OpenHands incubator **Sandbox** project, the repo should carry the standard sandbox warning badge in `README.md` and include a root `LICENSE` file to satisfy the incubator-program requirements.
