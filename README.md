# agent-server-gui

> [!WARNING]
> This project is in the **Sandbox** phase. It may be vibecoded, untested, or out of date. OpenHands takes no responsibility for the code or its support. [Learn more](https://github.com/OpenHands/incubator-program).

[![Project Status: Sandbox](https://img.shields.io/badge/status-sandbox-yellow)](https://github.com/OpenHands/incubator-program)

## Run this with OpenHands Agent Server first

If you only read one section of this README, read this one. Most users will want to clone this repo, point it at a real `openhands-agent-server`, and start using the UI immediately.

### Recommended local workflow

After you complete the install steps below, run `npm run dev` (or `npm run dev:safe`).

That command starts a dedicated local `agent-server` for this checkout on `127.0.0.1:18000` and points the frontend at it. It expects `agent-server` to already be installed and on your `PATH`. It isolates tmux state and conversation persistence by setting separate `TMUX_TMPDIR`, `OH_CONVERSATIONS_PATH`, `OH_BASH_EVENTS_DIR`, and `OH_VSCODE_PORT` values under `.openhands-dev/`, so it does not collide with other local or cloud-backed OpenHands sessions.

This is especially important if you are editing the repo from an OpenHands Cloud sandbox: **do not point this frontend at the sandbox's existing agent-server**. Current `agent-server` releases share the default `openhands` tmux socket and `workspace/conversations` persistence directory, so a naive second server in the same sandbox can break the OpenHands conversation that is powering your cloud session (for example with errors like `no server running on /tmp/tmux-*/openhands`).

Useful overrides:

- `OH_GUI_SAFE_BACKEND_PORT` — backend port for the isolated server (default `18000`)
- `OH_GUI_SAFE_VSCODE_PORT` — VS Code sidecar port (default `backend port + 1`)
- `OH_GUI_SAFE_STATE_DIR` — base directory for isolated server state
- `VITE_WORKING_DIR` — repo root used for new conversations (defaults to the current checkout)

If you would rather run the backend somewhere else entirely, point `VITE_BACKEND_HOST` / `VITE_BACKEND_BASE_URL` at that separate backend and use `npm run dev:frontend`. For frontend-only work with mocks, use `npm run dev:mock`.

### Prerequisites

- Node.js 22.12.x or later
- `npm`
- OpenHands Agent Server (`agent-server`) installed and available on your `PATH`

### 1. Clone and install the frontend

```sh
git clone https://github.com/OpenHands/agent-server-gui.git
cd agent-server-gui
npm install
```

### 2. Install OpenHands Agent Server

If you do not already have the backend installed, install `uv` first (OpenHands SDK recommends `uv` 0.8.13+):

```sh
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Then install or upgrade the agent server package together with the tool/workspace dependencies that the SDK getting started page lists separately:

```sh
uv tool install -U \
  --with openhands-tools \
  --with openhands-workspace \
  --with libtmux \
  openhands-agent-server
```

`uv tool install` exposes the server as the `agent-server` CLI. If `~/.local/bin` is not already on your `PATH`, add it before continuing, for example:

```sh
export PATH="$HOME/.local/bin:$PATH"
command -v agent-server
```

Once `agent-server` is installed, `npm run dev` is the easiest from-scratch setup because it launches an isolated backend for this checkout automatically.

If you prefer to run the backend yourself instead, start it on the default local port:

```sh
agent-server --host 127.0.0.1 --port 8000
```

The frontend-only workflow below expects the backend at `127.0.0.1:8000` by default.

If you start the backend with `SESSION_API_KEY` or `OH_SESSION_API_KEYS_0`, every `/api/*` route is authenticated with `X-Session-API-Key`. In that case the frontend must send the same key via `VITE_SESSION_API_KEY`.

If you prefer installing from source or want the full SDK setup flow, see the OpenHands SDK docs: <https://docs.openhands.dev/sdk/getting-started>

### 3. Optional: create a `.env` file

If your backend is **not** running on `127.0.0.1:8000`, or if it requires a session API key, create a `.env` file:

```sh
cp .env.sample .env
```

Then update the values you need:

```dotenv
VITE_BACKEND_HOST="127.0.0.1:8000"
VITE_BACKEND_BASE_URL="http://127.0.0.1:8000"
VITE_FRONTEND_PORT="3001"
# Use the same value as backend SESSION_API_KEY or OH_SESSION_API_KEYS_0 when auth is enabled.
# VITE_SESSION_API_KEY="your-session-api-key"
# VITE_WORKING_DIR="/absolute/path/to/the-workspace-used-by-agent-server"
```

Notes:

- `VITE_BACKEND_HOST` is used by the Vite dev proxy for `/api`, `/server_info`, and `/sockets`.
- `VITE_BACKEND_BASE_URL` is used by browser-side direct requests. Keep it pointed at the same backend.
- `VITE_WORKING_DIR` should match the workspace path the backend will use when starting new conversations.
- If the backend is secured with `SESSION_API_KEY` or `OH_SESSION_API_KEYS_0`, set `VITE_SESSION_API_KEY` to the same value or live requests will fail with `401 Unauthorized`.
- If your backend does not require `X-Session-API-Key`, leave `VITE_SESSION_API_KEY` unset.

### 4. Start the recommended local dev stack

```sh
npm run dev
```

This starts an isolated local `agent-server` for this checkout and the frontend on [http://localhost:3001](http://localhost:3001).

### 5. Start only the frontend against a backend you already launched (optional)

```sh
npm run dev:frontend
```

Use this only if you intentionally started `agent-server` yourself or want the frontend to talk to another backend.

### 6. First-run sanity check

After the page opens:

- `/` should load without errors
- `/settings` should load
  - on secured backends, make sure `VITE_SESSION_API_KEY` matches the backend session key
  - configure a working LLM model + API key under `Settings > LLM` before running the first live task
  - if your backend is too old to expose settings schemas, the UI will show an actionable `SDK settings schema unavailable.` message instead of crashing
- you should be able to open or create a conversation
- `/conversations/:id` should load conversation content
- if you want the Git / Changes panels to point at this repo, set `VITE_WORKING_DIR` to the actual repo root (for this checkout that is `/workspace/project/agent-server-gui`), not just the parent workspace directory

### Mock mode

If you want to run the frontend without a live backend, use:

```sh
npm run dev:mock
# or
npm run dev:mock:saas
```

## Overview

This repository is a near-direct port of the OpenHands frontend adapted to talk directly to `software-agent-sdk` / `agent_server` without the usual OpenHands app backend.

## Tech Stack

- Remix SPA Mode (React + Vite + React Router)
- TypeScript
- Redux
- TanStack Query
- Tailwind CSS
- i18next
- React Testing Library
- Vitest
- Mock Service Worker

## Building for Production

There is no `Makefile` in this repository. Use the npm scripts instead:

```sh
npm run build
npm run start
```

## Environment Variables

The frontend application uses the following environment variables:

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

You can create a `.env` file in the project directory with these variables based on `.env.sample`.

### Project Structure

```sh
frontend
├── __tests__ # Tests
├── public
├── src
│   ├── api # API calls
│   ├── assets
│   ├── components
│   ├── context # Local state management
│   ├── hooks # Custom hooks
│   ├── i18n # Internationalization
│   ├── mocks # MSW mocks for development
│   ├── routes # React Router file-based routes
│   ├── services
│   ├── state # Redux state management
│   ├── types
│   ├── utils # Utility/helper functions
│   └── root.tsx # Entry point
└── .env.sample # Sample environment variables
```

#### Components

Components are organized into folders based on their **domain**, **feature**, or **shared functionality**.

```sh
components
├── features # Domain-specific components
├── layout
├── modals
└── ui # Shared UI components
```

### Features

- Real-time updates with WebSockets
- Internationalization
- Router data loading with Remix
- User authentication with GitHub OAuth (if saas mode is enabled)

## Testing

### Testing Framework and Tools

We use the following testing tools:

- **Test Runner**: Vitest
- **Rendering**: React Testing Library
- **User Interactions**: @testing-library/user-event
- **API Mocking**: [Mock Service Worker (MSW)](https://mswjs.io/)
- **Code Coverage**: Vitest with V8 coverage

### Running Tests

To run all tests:

```sh
npm run test
```

To run tests with coverage:

```sh
npm run test:coverage
```

### Testing Best Practices

1. **Component Testing**
   - Test components in isolation
   - Use our custom [`renderWithProviders()`](https://github.com/OpenHands/OpenHands/blob/ce26f1c6d3feec3eedf36f823dee732b5a61e517/frontend/test-utils.tsx#L56-L85) that wraps the components we want to test in our providers. It is especially useful for components that use Redux
   - Use `render()` from React Testing Library to render components
   - Prefer querying elements by role, label, or test ID over CSS selectors
   - Test both rendering and interaction scenarios

2. **User Event Simulation**
   - Use `userEvent` for simulating realistic user interactions
   - Test keyboard events, clicks, typing, and other user actions
   - Handle edge cases like disabled states, empty inputs, etc.

3. **Mocking**
   - We test components that make network requests by mocking those requests with Mock Service Worker (MSW)
   - Use `vi.fn()` to create mock functions for callbacks and event handlers
   - Mock external dependencies and API calls (more info)[https://mswjs.io/docs/getting-started]
   - Verify mock function calls using `.toHaveBeenCalledWith()`, `.toHaveBeenCalledTimes()`

4. **Accessibility Testing**
   - Use `toBeInTheDocument()` to check element presence
   - Test keyboard navigation and screen reader compatibility
   - Verify correct ARIA attributes and roles

5. **State and Prop Testing**
   - Test component behavior with different prop combinations
   - Verify state changes and conditional rendering
   - Test error states and loading scenarios

6. **Internationalization (i18n) Testing**
   - Test translation keys and placeholders
   - Verify text rendering across different languages

Example Test Structure:

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

describe("ComponentName", () => {
  it("should render correctly", () => {
    render(<Component />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should handle user interactions", async () => {
    const mockCallback = vi.fn();
    const user = userEvent.setup();

    render(<Component onClick={mockCallback} />);
    const button = screen.getByRole("button");

    await user.click(button);
    expect(mockCallback).toHaveBeenCalledOnce();
  });
});
```

### Example Tests in the Codebase

For real-world examples of testing, check out these test files:

1. **Chat Input Component Test**:
   [`__tests__/components/chat/chat-input.test.tsx`](https://github.com/OpenHands/OpenHands/blob/main/frontend/__tests__/components/chat/chat-input.test.tsx)
   - Demonstrates comprehensive testing of a complex input component
   - Covers various scenarios like submission, disabled states, and user interactions

2. **File Explorer Component Test**:
   [`__tests__/components/file-explorer/file-explorer.test.tsx`](https://github.com/OpenHands/OpenHands/blob/main/frontend/__tests__/components/file-explorer/file-explorer.test.tsx)
   - Shows testing of a more complex component with multiple interactions
   - Illustrates testing of nested components and state management

### Test Coverage

- Aim for high test coverage, especially for critical components
- Focus on testing different scenarios and edge cases
- Use code coverage reports to identify untested code paths

### Continuous Integration

Tests are automatically run during:

- Pre-commit hooks
- Pull request checks
- CI/CD pipeline

## Contributing

Please read the [CONTRIBUTING.md](../CONTRIBUTING.md) file for details on our code of conduct, and the process for submitting pull requests to us.

## Troubleshooting

TODO
