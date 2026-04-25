import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import {
  AgentServerIncompatibilityError,
  MINIMUM_SUPPORTED_AGENT_SERVER_VERSION,
} from "#/api/agent-server-compatibility";
import OptionService from "#/api/option-service/option-service.api";
import { server } from "#/mocks/node";

describe("OptionService", () => {
  it("returns config in mock mode without a live backend", async () => {
    const config = await OptionService.getConfig();

    expect(config.app_mode).toBe("oss");
    expect(config.feature_flags.deployment_mode).toBe("self_hosted");
    expect(config.updated_at).toBeTruthy();
  });

  it("throws a compatibility error when the agent server version is below the supported minimum", async () => {
    server.use(
      http.get("/server_info", () =>
        HttpResponse.json({ uptime: 0, idle_time: 0, version: "1.16.1" }),
      ),
    );

    await expect(OptionService.getConfig()).rejects.toMatchObject({
      name: AgentServerIncompatibilityError.name,
      serverVersion: "1.16.1",
      message: expect.stringContaining(MINIMUM_SUPPORTED_AGENT_SERVER_VERSION),
    });
  });

  it("uses only server version metadata for compatibility checks", async () => {
    server.use(
      http.get("/server_info", () =>
        HttpResponse.json({
          uptime: 0,
          idle_time: 0,
          version: MINIMUM_SUPPORTED_AGENT_SERVER_VERSION,
        }),
      ),
      http.get("/api/settings/agent-schema", () =>
        HttpResponse.json({ error: "missing" }, { status: 404 }),
      ),
      http.get("/api/settings/conversation-schema", () =>
        HttpResponse.json({ error: "missing" }, { status: 404 }),
      ),
    );

    await expect(OptionService.getConfig()).resolves.toMatchObject({
      app_mode: "oss",
      feature_flags: expect.objectContaining({
        deployment_mode: "self_hosted",
      }),
    });
  });

  it("returns models from mocked LLM endpoints", async () => {
    const models = await OptionService.getModels();

    expect(models.models).toContain("openhands/claude-opus-4-5-20251101");
    expect(models.verified_models).toContain("claude-opus-4-5-20251101");
    expect(models.verified_providers).toEqual(["anthropic", "openhands"]);
    expect(models.default_model).toBeTruthy();
  });
});
