import { describe, expect, it } from "vitest";
import ConfigService from "#/api/config-service/config-service.api";

describe("ConfigService", () => {
  it("derives providers from llm endpoints", async () => {
    const page = await ConfigService.searchProviders({ limit: 10 });

    expect(page.next_page_id).toBeNull();
    expect(page.items.some((provider) => provider.name === "anthropic")).toBe(true);
    expect(
      page.items.find((provider) => provider.name === "anthropic")?.verified,
    ).toBe(true);
  });

  it("derives provider models from llm endpoints", async () => {
    const page = await ConfigService.searchModels({
      provider__eq: "anthropic",
      limit: 20,
    });

    expect(page.next_page_id).toBeNull();
    expect(page.items.some((model) => model.name === "claude-opus-4-5-20251101")).toBe(
      true,
    );
    expect(page.items.every((model) => model.provider === "anthropic")).toBe(true);
  });
});
