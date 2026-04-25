import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import { SettingsNavigation } from "#/components/features/settings/settings-navigation";
import { OSS_NAV_ITEMS } from "#/constants/settings-nav";
import { SettingsNavRenderedItem } from "#/hooks/use-settings-nav-items";

const baseItems: SettingsNavRenderedItem[] = [
  { type: "header", text: "SETTINGS$TITLE" as never },
  { type: "item", item: OSS_NAV_ITEMS[0] },
  { type: "divider" },
  { type: "item", item: OSS_NAV_ITEMS[1] },
];

describe("SettingsNavigation", () => {
  it("renders the provided OSS navigation items, headers, and dividers", () => {
    render(
      <MemoryRouter>
        <SettingsNavigation
          isMobileMenuOpen={false}
          onCloseMobileMenu={vi.fn()}
          navigationItems={baseItems}
        />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("settings-navbar")).toBeInTheDocument();
    expect(screen.getAllByText("SETTINGS$TITLE").length).toBeGreaterThan(0);
    expect(screen.getByText("SETTINGS$NAV_LLM")).toBeInTheDocument();
    expect(screen.getByText("SETTINGS$NAV_CONDENSER")).toBeInTheDocument();
  });
});
