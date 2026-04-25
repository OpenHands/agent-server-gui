import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SecretsSettingsScreen, { clientLoader } from "#/routes/secrets-settings";
import { SecretsService } from "#/api/secrets-service";

function renderSecretsSettingsScreen() {
  return render(<SecretsSettingsScreen />, {
    wrapper: ({ children }) => (
      <QueryClientProvider
        client={new QueryClient({
          defaultOptions: { queries: { retry: false } },
        })}
      >
        {children}
      </QueryClientProvider>
    ),
  });
}

describe("SecretsSettingsScreen", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the OSS secrets list for local secrets management", async () => {
    vi.spyOn(SecretsService, "searchSecrets")
      .mockResolvedValueOnce({
        items: [
          {
            name: "MY_SECRET",
            description: "Demo secret",
          },
        ],
        next_page_id: null,
      })
      .mockResolvedValue({
        items: [],
        next_page_id: null,
      });

    renderSecretsSettingsScreen();

    await screen.findByTestId("secrets-settings-screen");
    expect(await screen.findByText("MY_SECRET")).toBeInTheDocument();
    expect(screen.getByTestId("add-secret-button")).toBeInTheDocument();
  });
});

describe("clientLoader permission checks", () => {
  it("exports a clientLoader", () => {
    expect(clientLoader).toBeDefined();
    expect(typeof clientLoader).toBe("function");
  });
});
