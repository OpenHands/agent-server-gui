import {
  LLMMetadataClient,
  ServerClient,
  SettingsClient,
  SkillsClient,
  VSCodeClient,
} from "../../vendor/openhands-typescript-client/src/clients";
import { HttpClient } from "../../vendor/openhands-typescript-client/src/client/http-client";
import { RemoteEventsList } from "../../vendor/openhands-typescript-client/src/events/remote-events-list";
import { RemoteWorkspace } from "../../vendor/openhands-typescript-client/src/workspace/remote-workspace";
import { buildHttpBaseUrl } from "#/utils/websocket-url";
import {
  getAgentServerBaseUrl,
  getAgentServerSessionApiKey,
  getAgentServerWorkingDir,
} from "./agent-server-config";

interface TypeScriptClientOverrides {
  host?: string;
  apiKey?: string | null;
  sessionApiKey?: string | null;
  workingDir?: string;
  conversationUrl?: string | null;
}

interface ResolvedClientOptions {
  host: string;
  apiKey?: string;
  workingDir: string;
}

function resolveClientOptions(
  overrides: TypeScriptClientOverrides = {},
): ResolvedClientOptions {
  const host = overrides.host
    ? overrides.host.replace(/\/$/, "")
    : overrides.conversationUrl
      ? buildHttpBaseUrl(overrides.conversationUrl)
      : getAgentServerBaseUrl();

  const apiKey =
    overrides.sessionApiKey ??
    overrides.apiKey ??
    getAgentServerSessionApiKey() ??
    undefined;

  return {
    host,
    ...(apiKey ? { apiKey } : {}),
    workingDir: overrides.workingDir ?? getAgentServerWorkingDir(),
  };
}

export function createServerClient(
  overrides?: TypeScriptClientOverrides,
): ServerClient {
  const { host, apiKey } = resolveClientOptions(overrides);
  return new ServerClient({ host, ...(apiKey ? { apiKey } : {}) });
}

export function createLlmMetadataClient(
  overrides?: TypeScriptClientOverrides,
): LLMMetadataClient {
  const { host, apiKey } = resolveClientOptions(overrides);
  return new LLMMetadataClient({ host, ...(apiKey ? { apiKey } : {}) });
}

export function createSettingsClient(
  overrides?: TypeScriptClientOverrides,
): SettingsClient {
  const { host, apiKey } = resolveClientOptions(overrides);
  return new SettingsClient({ host, ...(apiKey ? { apiKey } : {}) });
}

export function createSkillsClient(
  overrides?: TypeScriptClientOverrides,
): SkillsClient {
  const { host, apiKey } = resolveClientOptions(overrides);
  return new SkillsClient({ host, ...(apiKey ? { apiKey } : {}) });
}

export function createVSCodeClient(
  overrides?: TypeScriptClientOverrides,
): VSCodeClient {
  const { host, apiKey } = resolveClientOptions(overrides);
  return new VSCodeClient({ host, ...(apiKey ? { apiKey } : {}) });
}

export function createHttpClient(
  overrides?: TypeScriptClientOverrides,
): HttpClient {
  const { host, apiKey } = resolveClientOptions(overrides);
  return new HttpClient({
    baseUrl: host,
    ...(apiKey ? { apiKey } : {}),
    timeout: 60000,
  });
}

export function createRemoteEventsList(
  conversationId: string,
  overrides?: TypeScriptClientOverrides,
): RemoteEventsList {
  return new RemoteEventsList(createHttpClient(overrides), conversationId);
}

export function createRemoteWorkspace(
  overrides?: TypeScriptClientOverrides,
): RemoteWorkspace {
  const { host, apiKey, workingDir } = resolveClientOptions(overrides);
  return new RemoteWorkspace({
    host,
    workingDir,
    ...(apiKey ? { apiKey } : {}),
  });
}
