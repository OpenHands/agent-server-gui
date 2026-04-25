import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import App from "#/root";
import { server } from "#/mocks/node";

const RouterStub = createRoutesStub([
  {
    Component: App,
    path: "/",
    children: [
      {
        Component: () => <div data-testid="app-outlet">app outlet</div>,
        path: "/",
      },
    ],
  },
]);

const renderApp = (initialEntries: string[] = ["/"]) =>
  render(<RouterStub initialEntries={initialEntries} />, {
    wrapper: ({ children }) => (
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false } },
          })
        }
      >
        {children}
      </QueryClientProvider>
    ),
  });

describe("App root compatibility guard", () => {
  it("blocks the app on any page when the connected agent server is incompatible", async () => {
    server.use(
      http.get("/server_info", () =>
        HttpResponse.json({ uptime: 0, idle_time: 0, version: "1.16.1" }),
      ),
      http.get("/api/settings/agent-schema", () =>
        HttpResponse.json({ error: "missing" }, { status: 404 }),
      ),
      http.get("/api/settings/conversation-schema", () =>
        HttpResponse.json({ error: "missing" }, { status: 404 }),
      ),
    );

    renderApp(["/"]);

    await waitFor(() => {
      expect(
        screen.getByTestId("agent-server-incompatibility-warning"),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(/unsupported agent server version/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/1\.16\.1/)).toHaveLength(2);
    expect(screen.queryByTestId("app-outlet")).not.toBeInTheDocument();
  });

  it("renders the routed page when the agent server is compatible", async () => {
    renderApp(["/"]);

    await waitFor(() => {
      expect(screen.getByTestId("app-outlet")).toBeInTheDocument();
    });

    expect(
      screen.queryByTestId("agent-server-incompatibility-warning"),
    ).not.toBeInTheDocument();
  });
});
