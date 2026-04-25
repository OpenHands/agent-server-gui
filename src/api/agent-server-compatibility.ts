import {
  createServerClient,
  createSettingsClient,
} from "#/api/typescript-client";

const REQUIRED_SETTINGS_SCHEMA_ENDPOINTS = [
  "/api/settings/agent-schema",
  "/api/settings/conversation-schema",
] as const;

const getErrorStatus = (error: unknown): number | undefined => {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === "number") {
      return status;
    }
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "cause" in error &&
    error.cause !== undefined
  ) {
    return getErrorStatus(error.cause);
  }

  return undefined;
};

const getServerVersion = (serverInfo: unknown): string | null => {
  if (
    typeof serverInfo === "object" &&
    serverInfo !== null &&
    "version" in serverInfo &&
    typeof serverInfo.version === "string" &&
    serverInfo.version.length > 0
  ) {
    return serverInfo.version;
  }

  return null;
};

const buildCompatibilityMessage = (serverVersion: string | null) => {
  const versionMessage = serverVersion
    ? `Connected agent server version ${serverVersion} is not compatible with this frontend.`
    : "The connected agent server is not compatible with this frontend.";

  return `${versionMessage} This frontend requires the settings schema endpoints ${REQUIRED_SETTINGS_SCHEMA_ENDPOINTS.join(" and ")}. Upgrade the agent server and reload the page.`;
};

export class AgentServerIncompatibilityError extends Error {
  readonly serverVersion: string | null;

  constructor(serverVersion: string | null) {
    super(buildCompatibilityMessage(serverVersion));
    this.name = "AgentServerIncompatibilityError";
    this.serverVersion = serverVersion;
  }
}

export const isAgentServerIncompatibilityError = (
  error: unknown,
): error is AgentServerIncompatibilityError =>
  error instanceof AgentServerIncompatibilityError ||
  (typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AgentServerIncompatibilityError");

export async function ensureCompatibleAgentServer() {
  const serverClient = createServerClient();
  const settingsClient = createSettingsClient();

  const [serverInfoResult, agentSchemaResult, conversationSchemaResult] =
    await Promise.allSettled([
      serverClient.getServerInfo(),
      settingsClient.getAgentSchema(),
      settingsClient.getConversationSchema(),
    ]);

  if (serverInfoResult.status === "rejected") {
    throw serverInfoResult.reason;
  }

  const schemaErrors = [agentSchemaResult, conversationSchemaResult]
    .filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    )
    .map((result) => result.reason);

  if (schemaErrors.some((error) => getErrorStatus(error) === 404)) {
    throw new AgentServerIncompatibilityError(
      getServerVersion(serverInfoResult.value),
    );
  }

  if (schemaErrors.length > 0) {
    throw schemaErrors[0];
  }

  return serverInfoResult.value;
}
