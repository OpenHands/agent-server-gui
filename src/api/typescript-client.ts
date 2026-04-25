import {
  LLMMetadataClient,
  ServerClient,
  SettingsClient,
  SkillsClient,
  VSCodeClient,
} from "@openhands/typescript-client/clients";
export type { ServerInfo } from "@openhands/typescript-client";
import { HttpClient } from "@openhands/typescript-client/client/http-client";
import { RemoteEventsList } from "@openhands/typescript-client/events/remote-events-list";
import { RemoteWorkspace } from "@openhands/typescript-client/workspace/remote-workspace";
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
  timeout?: number;
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
  return new ServerClient({
    host,
    ...(apiKey ? { apiKey } : {}),
    ...(overrides?.timeout ? { timeout: overrides.timeout } : {}),
  });
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
