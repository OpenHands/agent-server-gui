import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRoutesStub } from "react-router";
import SettingsScreen, { clientLoader } from "#/routes/settings";
import OptionService from "#/api/option-service/option-service.api";
import { getFirstAvailablePath } from "#/utils/settings-utils";
import { OSS_NAV_ITEMS } from "#/constants/settings-nav";

vi.mock("#/hooks/use-settings-nav-items", () => ({
  useSettingsNavItems: () => [
    { type: "item", item: OSS_NAV_ITEMS[0] },
    { type: "item", item: OSS_NAV_ITEMS[6] },
  ],
}));

describe("settings route", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("prefers OSS fallback routes only", () => {
    expect(
      getFirstAvailablePath({
        enable_billing: false,
        hide_llm_settings: true,
        enable_jira: false,
        enable_jira_dc: false,
        enable_linear: false,
        hide_users_page: true,
        hide_billing_page: true,
        hide_integrations_page: false,
        deployment_mode: "self_hosted",
      }),
    ).toBe("/settings/mcp");
  });

  it("redirects hidden OSS settings pages to the first available route", async () => {
    vi.spyOn(OptionService, "getConfig").mockResolvedValue({
      app_mode: "oss",
      posthog_client_key: null,
      feature_flags: {
        enable_billing: false,
        hide_llm_settings: true,
        enable_jira: false,
        enable_jira_dc: false,
        enable_linear: false,
        hide_users_page: true,
        hide_billing_page: true,
        hide_integrations_page: false,
        deployment_mode: "self_hosted",
      },
      providers_configured: [],
      maintenance_start_time: null,
      auth_url: null,
      recaptcha_site_key: null,
      faulty_models: [],
      error_message: null,
      updated_at: new Date().toISOString(),
      github_app_slug: null,
    });

    const response = (await clientLoader({
      request: new Request("http://localhost/settings"),
      params: {},
      context: {},
    } as never)) as Response;

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/settings/mcp");
  });

  it("renders the current OSS section title", () => {
    const RouterStub = createRoutesStub([
      {
        path: "/settings",
        Component: SettingsScreen,
        children: [
          {
            path: "/settings/app",
            Component: () => <div data-testid="app-settings-screen" />,
          },
        ],
      },
    ]);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterStub initialEntries={["/settings/app"]} />
      </QueryClientProvider>,
    );

    expect(screen.getAllByText("SETTINGS$NAV_APPLICATION").length).toBeGreaterThan(0);
    expect(screen.getByTestId("app-settings-screen")).toBeInTheDocument();
  });
});
