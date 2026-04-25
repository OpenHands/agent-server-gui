import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import { UserActions } from "#/components/features/sidebar/user-actions";
import { OSS_NAV_ITEMS } from "#/constants/settings-nav";

vi.mock("#/hooks/use-settings-nav-items", () => ({
  useSettingsNavItems: () => [
    { type: "item", item: OSS_NAV_ITEMS[0] },
    { type: "item", item: OSS_NAV_ITEMS[6] },
  ],
}));

describe("UserActions", () => {
  it("shows the OSS user menu on hover without SaaS-only actions", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <UserActions user={{ avatar_url: "https://example.com/avatar.png" }} />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    await user.hover(screen.getByTestId("user-actions"));

    expect(screen.getByTestId("user-context-menu")).toBeVisible();
    expect(screen.getByText("SETTINGS$NAV_LLM")).toBeInTheDocument();
    expect(screen.getByText("SETTINGS$NAV_APPLICATION")).toBeInTheDocument();
    expect(screen.getByText("SIDEBAR$DOCS")).toBeInTheDocument();
    expect(screen.queryByText("ACCOUNT_SETTINGS$LOGOUT")).not.toBeInTheDocument();
    expect(screen.queryByTestId("context-menu-cta")).not.toBeInTheDocument();
  });
});
