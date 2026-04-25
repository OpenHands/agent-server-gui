const STORAGE_KEY = "openhands-agent-server-config";

const OPENHANDS_CLOUD_RUNTIME_HOST_PATTERNS = [
  /(^|\.)[^.]*runtime\.all-hands\.dev$/i,
  /(^|\.)[^.]*runtime\.openhands\.ai$/i,
  /^work-.*\.all-hands\.dev$/i,
  /^work-.*\.openhands\.ai$/i,
];

const CLOUD_DEVELOPMENT_WARNING = [
  "OpenHands Cloud sandbox detected.",
  "Reuse the sandbox's existing agent-server and do not start a second `agent-server` in this sandbox.",
  "Current agent-server releases share tmux and conversation state across server instances, which can break the conversation backing OpenHands Cloud.",
  "Use `npm run dev:mock` if you need a fully isolated frontend-only workflow.",
].join(" ");

interface StoredAgentServerConfig {
  baseUrl?: string | null;
  sessionApiKey?: string | null;
  workingDir?: string | null;
}

function readStoredConfig(): StoredAgentServerConfig {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredAgentServerConfig;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function normalizeBaseUrl(value?: string | null): string | null {
  if (!value) return null;

  const trimmed = value.trim().replace(/\/$/, "");
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${trimmed}`;
  }

  return `http://${trimmed}`;
}

function shouldUseProxyOrigin(baseUrl: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const configuredUrl = new URL(baseUrl);
    const localHosts = new Set(["127.0.0.1", "localhost", "0.0.0.0"]);
    const browserHostname = window.location.hostname;

    return (
      localHosts.has(configuredUrl.hostname) &&
      !localHosts.has(browserHostname)
    );
  } catch {
    return false;
  }
}

function resolveAgentServerBaseUrl(baseUrl: string | null): string | null {
  if (!baseUrl) {
    return null;
  }

  if (shouldUseProxyOrigin(baseUrl)) {
    return window.location.origin;
  }

  return baseUrl;
}

export function isLikelyOpenHandsCloudRuntime(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return OPENHANDS_CLOUD_RUNTIME_HOST_PATTERNS.some((pattern) =>
    pattern.test(window.location.hostname),
  );
}

export function getCloudDevelopmentWarning(): string | null {
  return isLikelyOpenHandsCloudRuntime() ? CLOUD_DEVELOPMENT_WARNING : null;
}

export function getAgentServerBaseUrl(): string {
  const envUrl = resolveAgentServerBaseUrl(
    normalizeBaseUrl(import.meta.env.VITE_BACKEND_BASE_URL),
  );
  if (envUrl) return envUrl;

  const storedUrl = resolveAgentServerBaseUrl(
    normalizeBaseUrl(readStoredConfig().baseUrl),
  );
  if (storedUrl) return storedUrl;

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://127.0.0.1:8000";
}

export function getAgentServerSessionApiKey(): string | null {
  const envKey = import.meta.env.VITE_SESSION_API_KEY?.trim();
  if (envKey) return envKey;

  const storedKey = readStoredConfig().sessionApiKey?.trim();
  if (storedKey) return storedKey;

  return null;
}

export function getAgentServerWorkingDir(): string {
  const envDir = import.meta.env.VITE_WORKING_DIR?.trim();
  if (envDir) return envDir;

  const storedDir = readStoredConfig().workingDir?.trim();
  if (storedDir) return storedDir;

  return "/workspace/project";
}

export function getConfiguredWorkerUrls(): string[] {
  const raw = import.meta.env.VITE_WORKER_URLS?.trim();
  if (!raw) return [];

  return raw
    .split(",")
    .map((url: string) => normalizeBaseUrl(url))
    .filter((url: string | null): url is string => Boolean(url));
}

export function getAgentServerHeaders(): Record<string, string> {
  const sessionApiKey = getAgentServerSessionApiKey();
  return sessionApiKey ? { "X-Session-API-Key": sessionApiKey } : {};
}
