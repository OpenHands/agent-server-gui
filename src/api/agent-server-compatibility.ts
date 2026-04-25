import { createServerClient, type ServerInfo } from "#/api/typescript-client";

export const MINIMUM_SUPPORTED_AGENT_SERVER_VERSION = "1.17.0";

const SEMVER_PATTERN = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/;

const getServerVersion = (serverInfo: ServerInfo): string => serverInfo.version;

const parseSemver = (
  version: string | null,
): [number, number, number] | null => {
  if (!version) {
    return null;
  }

  const match = version.match(SEMVER_PATTERN);
  if (!match) {
    return null;
  }

  return match.slice(1, 4).map(Number) as [number, number, number];
};

const isSupportedAgentServerVersion = (serverVersion: string | null) => {
  const parsedVersion = parseSemver(serverVersion);
  const minimumVersion = parseSemver(MINIMUM_SUPPORTED_AGENT_SERVER_VERSION);

  if (!parsedVersion || !minimumVersion) {
    return false;
  }

  for (let index = 0; index < minimumVersion.length; index += 1) {
    if (parsedVersion[index] > minimumVersion[index]) {
      return true;
    }

    if (parsedVersion[index] < minimumVersion[index]) {
      return false;
    }
  }

  return true;
};

const buildCompatibilityMessage = (serverVersion: string | null) => {
  const versionMessage = serverVersion
    ? `Connected agent server version ${serverVersion} is not compatible with this frontend.`
    : "The connected agent server version could not be determined.";

  return `${versionMessage} This frontend requires agent server version ${MINIMUM_SUPPORTED_AGENT_SERVER_VERSION} or newer. Upgrade the agent server and reload the page.`;
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
  const serverInfo = await createServerClient().getServerInfo();
  const serverVersion = getServerVersion(serverInfo);

  if (!isSupportedAgentServerVersion(serverVersion)) {
    throw new AgentServerIncompatibilityError(serverVersion);
  }

  return serverInfo;
}
