import { describe, expect, it } from "vitest";
import OptionService from "#/api/option-service/option-service.api";

describe("OptionService", () => {
  it("returns config in mock mode without a live backend", async () => {
    const config = await OptionService.getConfig();

    expect(config.app_mode).toBe("oss");
    expect(config.feature_flags.deployment_mode).toBe("self_hosted");
    expect(config.updated_at).toBeTruthy();
  });

  it("returns models from mocked LLM endpoints", async () => {
    const models = await OptionService.getModels();

    expect(models.models).toContain("openhands/claude-opus-4-5-20251101");
    expect(models.verified_models).toContain("claude-opus-4-5-20251101");
    expect(models.verified_providers).toEqual(["anthropic", "openhands"]);
    expect(models.default_model).toBeTruthy();
  });
});
