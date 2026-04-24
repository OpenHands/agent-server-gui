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
