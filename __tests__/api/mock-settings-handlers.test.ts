import { describe, expect, it } from "vitest";
import SettingsService from "#/api/settings-service/settings-service.api";

describe("mock settings handlers", () => {
  it("returns the agent settings schema on the paths used by the UI", async () => {
    const schema = await SettingsService.getSettingsSchema();

    expect(schema.sections.some((section) => section.key === "llm")).toBe(true);
  });

  it("returns the conversation settings schema on the paths used by the UI", async () => {
    const schema = await SettingsService.getConversationSettingsSchema();

    expect(
      schema.sections.some((section) => section.key === "verification"),
    ).toBe(true);
  });
});
