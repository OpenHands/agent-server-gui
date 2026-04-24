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
- `npm run dev:mock` needs MSW handlers for the direct agent-server routes used by the adapted frontend, not the original OpenHands mock paths. Key routes that must stay covered are:
  - bootstrap/model loading: `/server_info`, `/api/llm/models/verified`, `/api/llm/providers`
  - settings schemas: `/api/settings/agent-schema`, `/api/settings/conversation-schema`
  - conversation browsing/loading: `/api/conversations/search`, `/api/conversations?ids=...`, `/api/conversations/:id`, `/api/conversations/:id/events/*`
  - runtime git panels: `/api/git/changes`, `/api/git/diff`
- Useful regression tests for mock mode live in `__tests__/api/option-service.test.ts`, `__tests__/api/mock-conversation-handlers.test.ts`, and `__tests__/api/mock-settings-handlers.test.ts`.
- Browser-verified mock-mode tour artifact was generated at `artifacts/frontend-tour.gif`.
- Live `agent_server` compatibility quirks discovered during browser verification:
  - `GET /api/conversations` expects repeated `ids` params (`?ids=a&ids=b`), not Axios's default bracket form (`ids[]=a`), so the shared Axios client needs a custom params serializer.
  - Runtime git panels should prefer the conversation's reported `workspace.working_dir` when present; falling back to `/workspace/project` can produce 500s like `Not a git repository` for direct local workspaces such as `/workspace/project/agent-server-gui`.
  - Live settings currently load with the `SDK settings schema unavailable.` placeholder when the backend does not expose `/api/settings/agent-schema` and `/api/settings/conversation-schema`; this is expected for the current local backend.
- README expectation: the very first section should be a concrete from-scratch quickstart for running this frontend against a real `openhands-agent-server` (clone, install backend, optional `.env`, run `npm run dev`). Keep live-backend instructions ahead of general project overview.



