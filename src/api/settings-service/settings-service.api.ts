import { DEFAULT_SETTINGS } from "#/services/settings";
import { Settings, SettingsSchema, SettingsValue } from "#/types/settings";
import { createSettingsClient } from "../typescript-client";

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
  const agentSettings = mergeRecords(
    DEFAULT_SETTINGS.agent_settings ?? {},
    settings.agent_settings ?? {},
  );
  const conversationSettings = mergeRecords(
    DEFAULT_SETTINGS.conversation_settings ?? {},
    settings.conversation_settings ?? {},
  );

  const merged = {
    ...deepClone(DEFAULT_SETTINGS),
    ...settings,
    provider_tokens_set: {
      ...(DEFAULT_SETTINGS.provider_tokens_set ?? {}),
      ...(settings.provider_tokens_set ?? {}),
    },
    agent_settings: agentSettings,
    conversation_settings: conversationSettings,
  } as Settings;

  const llm = agentSettings.llm as Record<string, SettingsValue> | undefined;
  const condenser = agentSettings.condenser as
    | Record<string, SettingsValue>
    | undefined;

  if (typeof agentSettings.agent === "string") {
    merged.agent = agentSettings.agent;
  }
  if (typeof llm?.model === "string" && llm.model.length > 0) {
    merged.llm_model = llm.model;
  }
  if (typeof llm?.base_url === "string") {
    merged.llm_base_url = llm.base_url;
  }
  if (typeof llm?.api_key === "string") {
    merged.llm_api_key = llm.api_key;
  }
  if (typeof condenser?.enabled === "boolean") {
    merged.enable_default_condenser = condenser.enabled;
  }
  if (typeof condenser?.max_size === "number") {
    merged.condenser_max_size = condenser.max_size;
  }
  if (agentSettings.mcp_config) {
    merged.mcp_config = agentSettings.mcp_config as Settings["mcp_config"];
  }

  if (typeof conversationSettings.confirmation_mode === "boolean") {
    merged.confirmation_mode = conversationSettings.confirmation_mode;
  }
  if (
    typeof conversationSettings.security_analyzer === "string" ||
    conversationSettings.security_analyzer === null
  ) {
    merged.security_analyzer = conversationSettings.security_analyzer as
      | string
      | null;
  }
  if (typeof conversationSettings.max_iterations === "number") {
    merged.max_iterations = conversationSettings.max_iterations;
  }

  merged.llm_api_key_set = !!merged.llm_api_key;
  merged.search_api_key_set = !!merged.search_api_key;

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
    return (await createSettingsClient().getAgentSchema()) as SettingsSchema;
  }

  static async getConversationSettingsSchema(): Promise<SettingsSchema> {
    return (await createSettingsClient().getConversationSchema()) as SettingsSchema;
  }

  static async saveSettings(
    settings: Partial<Settings> & Record<string, unknown>,
  ): Promise<boolean> {
    const current = await this.getSettings();

    const agentSettingsDiff = (settings.agent_settings_diff ??
      settings.agent_settings) as Record<string, SettingsValue> | undefined;
    const conversationSettingsDiff = (settings.conversation_settings_diff ??
      settings.conversation_settings) as
      | Record<string, SettingsValue>
      | undefined;

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

    const llm = nextAgentSettings.llm as
      | Record<string, SettingsValue>
      | undefined;
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
      nextSettings.confirmation_mode =
        nextConversationSettings.confirmation_mode;
    }
    if (typeof nextConversationSettings.security_analyzer === "string") {
      nextSettings.security_analyzer =
        nextConversationSettings.security_analyzer;
    }
    if (typeof nextConversationSettings.max_iterations === "number") {
      nextSettings.max_iterations = nextConversationSettings.max_iterations;
    }
    if (nextAgentSettings.mcp_config) {
      nextSettings.mcp_config =
        nextAgentSettings.mcp_config as Settings["mcp_config"];
    }

    delete nextSettings.agent_settings_diff;
    delete nextSettings.conversation_settings_diff;

    const merged = syncDerivedSettings(nextSettings);
    writeStoredSettings(merged);
    return true;
  }
}

export default SettingsService;
