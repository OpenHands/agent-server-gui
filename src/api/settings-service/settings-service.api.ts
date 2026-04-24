import { openHands } from "../open-hands-axios";
import { Settings, SettingsSchema, SettingsValue } from "#/types/settings";
import { DEFAULT_SETTINGS } from "#/services/settings";

const STORAGE_KEY = "openhands-agent-server-settings";

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const mergeRecords = (
  base: Record<string, SettingsValue> | null | undefined,
  next: Record<string, SettingsValue> | null | undefined,
) => ({ ...(base ?? {}), ...(next ?? {}) });

const readStoredSettings = (): Partial<Settings> => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return (JSON.parse(raw) as Partial<Settings>) ?? {};
  } catch {
    return {};
  }
};

const syncDerivedSettings = (settings: Partial<Settings>): Settings => {
  const merged = {
    ...deepClone(DEFAULT_SETTINGS),
    ...settings,
    provider_tokens_set: {
      ...(DEFAULT_SETTINGS.provider_tokens_set ?? {}),
      ...(settings.provider_tokens_set ?? {}),
    },
    agent_settings: mergeRecords(
      DEFAULT_SETTINGS.agent_settings ?? {},
      settings.agent_settings ?? {},
    ),
    conversation_settings: mergeRecords(
      DEFAULT_SETTINGS.conversation_settings ?? {},
      settings.conversation_settings ?? {},
    ),
  } as Settings;

  merged.llm_api_key_set = !!merged.llm_api_key;
  merged.search_api_key_set = !!merged.search_api_key;

  merged.agent_settings = {
    ...(merged.agent_settings ?? {}),
    agent: "Agent",
    llm: {
      model: merged.llm_model,
      base_url: merged.llm_base_url,
    },
    condenser: {
      enabled: merged.enable_default_condenser,
      max_size: merged.condenser_max_size,
    },
    ...(merged.mcp_config ? { mcp_config: merged.mcp_config } : {}),
  };

  merged.conversation_settings = {
    ...(merged.conversation_settings ?? {}),
    confirmation_mode: merged.confirmation_mode,
    security_analyzer: merged.security_analyzer,
    max_iterations: merged.max_iterations,
  };

  return merged;
};

const writeStoredSettings = (settings: Settings) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

class SettingsService {
  static async getSettings(): Promise<Settings> {
    return syncDerivedSettings(readStoredSettings());
  }

  static async getSettingsSchema(): Promise<SettingsSchema> {
    const { data } = await openHands.get<SettingsSchema>("/api/settings/agent-schema");
    return data;
  }

  static async getConversationSettingsSchema(): Promise<SettingsSchema> {
    const { data } = await openHands.get<SettingsSchema>(
      "/api/settings/conversation-schema",
    );
    return data;
  }

  static async saveSettings(
    settings: Partial<Settings> & Record<string, unknown>,
  ): Promise<boolean> {
    const current = await this.getSettings();

    const agentSettingsDiff = (settings.agent_settings_diff ??
      settings.agent_settings) as Record<string, SettingsValue> | undefined;
    const conversationSettingsDiff = (settings.conversation_settings_diff ??
      settings.conversation_settings) as Record<string, SettingsValue> | undefined;

    const nextAgentSettings = mergeRecords(
      current.agent_settings ?? {},
      agentSettingsDiff,
    );
    const nextConversationSettings = mergeRecords(
      current.conversation_settings ?? {},
      conversationSettingsDiff,
    );

    const nextSettings: Partial<Settings> & Record<string, unknown> = {
      ...current,
      ...settings,
      agent_settings: nextAgentSettings,
      conversation_settings: nextConversationSettings,
    };

    const llm = nextAgentSettings.llm as Record<string, SettingsValue> | undefined;
    const condenser = nextAgentSettings.condenser as
      | Record<string, SettingsValue>
      | undefined;

    if (llm) {
      if (typeof llm.model === "string") nextSettings.llm_model = llm.model;
      if (typeof llm.base_url === "string") {
        nextSettings.llm_base_url = llm.base_url;
      }
      if (typeof llm.api_key === "string") {
        nextSettings.llm_api_key = llm.api_key;
      }
    }

    if (condenser) {
      if (typeof condenser.enabled === "boolean") {
        nextSettings.enable_default_condenser = condenser.enabled;
      }
      if (typeof condenser.max_size === "number") {
        nextSettings.condenser_max_size = condenser.max_size;
      }
    }

    if (typeof nextConversationSettings.confirmation_mode === "boolean") {
      nextSettings.confirmation_mode = nextConversationSettings.confirmation_mode;
    }
    if (typeof nextConversationSettings.security_analyzer === "string") {
      nextSettings.security_analyzer =
        nextConversationSettings.security_analyzer;
    }
    if (typeof nextConversationSettings.max_iterations === "number") {
      nextSettings.max_iterations = nextConversationSettings.max_iterations;
    }
    if (nextAgentSettings.mcp_config) {
      nextSettings.mcp_config = nextAgentSettings.mcp_config as Settings["mcp_config"];
    }

    delete nextSettings.agent_settings_diff;
    delete nextSettings.conversation_settings_diff;

    const merged = syncDerivedSettings(nextSettings);
    writeStoredSettings(merged);
    return true;
  }
}

export default SettingsService;
