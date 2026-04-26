import { beforeEach, describe, expect, it } from "vitest";

import SettingsService from "#/api/settings-service/settings-service.api";

const STORAGE_KEY = "openhands-agent-server-settings";

describe("SettingsService", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("treats nested SDK settings as the source of truth when loading", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        agent: "Agent",
        llm_model: "stale-top-level-model",
        llm_base_url: "https://stale.example.com",
        llm_api_key: "stale-key",
        enable_default_condenser: false,
        condenser_max_size: 12,
        confirmation_mode: false,
        security_analyzer: null,
        max_iterations: 5,
        agent_settings: {
          agent: "CodeActAgent",
          llm: {
            model: "nested-model",
            base_url: "https://nested.example.com",
            api_key: "nested-key",
          },
          condenser: {
            enabled: true,
            max_size: 321,
          },
        },
        conversation_settings: {
          confirmation_mode: true,
          security_analyzer: "llm",
          max_iterations: 77,
        },
      }),
    );

    const settings = await SettingsService.getSettings();

    expect(settings.agent).toBe("CodeActAgent");
    expect(settings.llm_model).toBe("nested-model");
    expect(settings.llm_base_url).toBe("https://nested.example.com");
    expect(settings.llm_api_key).toBe("nested-key");
    expect(settings.enable_default_condenser).toBe(true);
    expect(settings.condenser_max_size).toBe(321);
    expect(settings.confirmation_mode).toBe(true);
    expect(settings.security_analyzer).toBe("llm");
    expect(settings.max_iterations).toBe(77);
    expect(settings.agent_settings?.agent).toBe("CodeActAgent");
  });

  it("keeps top-level mirrors in sync when saving nested settings diffs", async () => {
    await SettingsService.saveSettings({
      agent_settings_diff: {
        agent: "CodeActAgent",
        llm: {
          model: "saved-model",
          base_url: "https://saved.example.com",
          api_key: "saved-key",
        },
      },
      conversation_settings_diff: {
        confirmation_mode: true,
        security_analyzer: "llm",
        max_iterations: 33,
      },
    });

    const settings = await SettingsService.getSettings();

    expect(settings.llm_model).toBe("saved-model");
    expect(settings.llm_base_url).toBe("https://saved.example.com");
    expect(settings.llm_api_key).toBe("saved-key");
    expect(settings.confirmation_mode).toBe(true);
    expect(settings.security_analyzer).toBe("llm");
    expect(settings.max_iterations).toBe(33);
    expect(settings.agent_settings?.llm).toMatchObject({
      model: "saved-model",
      base_url: "https://saved.example.com",
      api_key: "saved-key",
    });
    expect(settings.conversation_settings).toMatchObject({
      confirmation_mode: true,
      security_analyzer: "llm",
      max_iterations: 33,
    });
  });
});
