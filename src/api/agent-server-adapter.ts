import axios from "axios";
import { DEFAULT_SETTINGS } from "#/services/settings";
import { Settings } from "#/types/settings";
import { getAgentServerBaseUrl, getAgentServerSessionApiKey, getAgentServerWorkingDir, getConfiguredWorkerUrls } from "./agent-server-config";
import {
  GetHooksResponse,
  GetSkillsResponse,
  PluginSpec,
  V1AppConversation,
  V1AppConversationPage,
} from "./conversation-service/v1-conversation-service.types";
import { V1ExecutionStatus } from "#/types/v1/core";
import { V1SandboxInfo, V1SandboxStatus } from "./sandbox-service/sandbox-service.types";

export interface DirectConversationInfo {
  id: string;
  title?: string | null;
  created_at: string;
  updated_at: string;
  execution_status?: string | null;
  metrics?: {
    accumulated_cost?: number | null;
    max_budget_per_task?: number | null;
    accumulated_token_usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      cache_read_tokens?: number;
      cache_write_tokens?: number;
      context_window?: number;
      per_turn_token?: number;
    } | null;
  } | null;
  agent?: {
    llm?: {
      model?: string | null;
    } | null;
  } | null;
  workspace?: {
    working_dir?: string | null;
  } | null;
}

const DEFAULT_TOOL_NAMES = ["TerminalTool", "FileEditorTool", "TaskTrackerTool"];

function browserToolsEnabled() {
  return import.meta.env.VITE_ENABLE_BROWSER_TOOLS !== "false";
}

export function mapExecutionStatusToSandboxStatus(
  executionStatus?: string | null,
): V1SandboxStatus {
  switch (executionStatus) {
    case "paused":
      return "PAUSED";
    case "error":
    case "stuck":
      return "ERROR";
    case "running":
    case "waiting_for_confirmation":
    case "finished":
    case "idle":
    default:
      return "RUNNING";
  }
}

export function toConversationUrl(conversationId: string): string {
  return `${getAgentServerBaseUrl()}/api/conversations/${conversationId}`;
}

export function toV1AppConversation(
  info: DirectConversationInfo,
): V1AppConversation {
  return {
    id: info.id,
    created_by_user_id: null,
    sandbox_id: info.id,
    selected_repository: null,
    selected_branch: null,
    git_provider: null,
    title: info.title ?? null,
    trigger: null,
    pr_number: [],
    llm_model: info.agent?.llm?.model ?? DEFAULT_SETTINGS.llm_model,
    metrics: info.metrics
      ? {
          accumulated_cost: info.metrics.accumulated_cost ?? null,
          max_budget_per_task: info.metrics.max_budget_per_task ?? null,
          accumulated_token_usage: info.metrics.accumulated_token_usage
            ? {
                prompt_tokens:
                  info.metrics.accumulated_token_usage.prompt_tokens ?? 0,
                completion_tokens:
                  info.metrics.accumulated_token_usage.completion_tokens ?? 0,
                cache_read_tokens:
                  info.metrics.accumulated_token_usage.cache_read_tokens ?? 0,
                cache_write_tokens:
                  info.metrics.accumulated_token_usage.cache_write_tokens ?? 0,
                context_window:
                  info.metrics.accumulated_token_usage.context_window ?? 0,
                per_turn_token:
                  info.metrics.accumulated_token_usage.per_turn_token ?? 0,
              }
            : null,
        }
      : null,
    created_at: info.created_at,
    updated_at: info.updated_at,
    sandbox_status: mapExecutionStatusToSandboxStatus(info.execution_status),
    execution_status:
      (info.execution_status as V1AppConversation["execution_status"]) ??
      V1ExecutionStatus.IDLE,
    conversation_url: toConversationUrl(info.id),
    session_api_key: getAgentServerSessionApiKey(),
    workspace: {
      working_dir: info.workspace?.working_dir ?? getAgentServerWorkingDir(),
    },
    public: false,
    sub_conversation_ids: [],
  };
}

export function toV1ConversationPage(data: {
  items: DirectConversationInfo[];
  next_page_id?: string | null;
}): V1AppConversationPage {
  return {
    items: data.items.map(toV1AppConversation),
    next_page_id: data.next_page_id ?? null,
  };
}

function getConfirmationPolicy(settings: Settings) {
  return settings.confirmation_mode
    ? { kind: "AlwaysConfirm" }
    : { kind: "NeverConfirm" };
}

function getSecurityAnalyzer(settings: Settings) {
  switch (settings.security_analyzer) {
    case "llm":
      return { kind: "LLMSecurityAnalyzer" };
    case "pattern":
      return { kind: "PatternSecurityAnalyzer" };
    case "policy_rail":
      return { kind: "PolicyRailSecurityAnalyzer" };
    default:
      return undefined;
  }
}

function getAgentTools() {
  const tools = DEFAULT_TOOL_NAMES.map((name) => ({ name, params: {} }));
  if (browserToolsEnabled()) {
    tools.push({ name: "BrowserToolSet", params: {} });
  }
  return tools;
}

function buildInitialMessage(
  query?: string,
  conversationInstructions?: string,
) {
  const parts = [query?.trim(), conversationInstructions?.trim()].filter(Boolean);
  if (parts.length === 0) {
    return null;
  }

  return {
    role: "user",
    content: [{ type: "text", text: parts.join("\n\n") }],
  };
}

export function buildStartConversationRequest(options: {
  settings: Settings;
  query?: string;
  conversationInstructions?: string;
  plugins?: PluginSpec[];
}) {
  const { settings, query, conversationInstructions, plugins } = options;

  const llm: Record<string, unknown> = {
    model: settings.llm_model || DEFAULT_SETTINGS.llm_model,
  };

  if (settings.llm_api_key) {
    llm.api_key = settings.llm_api_key;
  }
  if (settings.llm_base_url) {
    llm.base_url = settings.llm_base_url;
  }

  const agent: Record<string, unknown> = {
    kind: "Agent",
    llm,
    tools: getAgentTools(),
  };

  const payload: Record<string, unknown> = {
    agent,
    workspace: {
      kind: "LocalWorkspace",
      working_dir: getAgentServerWorkingDir(),
    },
    confirmation_policy: getConfirmationPolicy(settings),
    max_iterations: settings.max_iterations ?? 500,
    stuck_detection: true,
    autotitle: true,
  };

  const securityAnalyzer = getSecurityAnalyzer(settings);
  if (securityAnalyzer) {
    payload.security_analyzer = securityAnalyzer;
  }

  const initialMessage = buildInitialMessage(query, conversationInstructions);
  if (initialMessage) {
    payload.initial_message = initialMessage;
  }

  if (plugins?.length) {
    payload.plugins = plugins.map((plugin) => ({
      source: plugin.source,
      ...(plugin.ref ? { ref: plugin.ref } : {}),
      ...(plugin.repo_path ? { repo_path: plugin.repo_path } : {}),
    }));
  }

  return payload;
}

export async function downloadTextFile(path: string): Promise<string> {
  const response = await axios.get<ArrayBuffer>(
    `${getAgentServerBaseUrl()}/api/file/download`,
    {
      params: { path },
      headers: getAgentServerSessionApiKey()
        ? { "X-Session-API-Key": getAgentServerSessionApiKey()! }
        : undefined,
      responseType: "arraybuffer",
    },
  );

  return new TextDecoder().decode(response.data);
}

export function createSandboxInfo(conversation: V1AppConversation): V1SandboxInfo {
  const exposed_urls = getConfiguredWorkerUrls().map((url, index) => ({
    name: `WORKER_${index + 1}`,
    url,
  }));

  return {
    id: conversation.sandbox_id,
    created_by_user_id: null,
    sandbox_spec_id: conversation.sandbox_id,
    status: conversation.sandbox_status,
    session_api_key: conversation.session_api_key,
    exposed_urls,
    created_at: conversation.created_at,
  };
}

export async function loadSkillsForConversation(
  _conversation: V1AppConversation | null | undefined,
): Promise<GetSkillsResponse> {
  const response = await axios.post<{ skills: GetSkillsResponse["skills"] }>(
    `${getAgentServerBaseUrl()}/api/skills`,
    {
      load_public: true,
      load_user: true,
      load_project: true,
      load_org: false,
      project_dir: getAgentServerWorkingDir(),
    },
    {
      headers: getAgentServerSessionApiKey()
        ? { "X-Session-API-Key": getAgentServerSessionApiKey()! }
        : undefined,
    },
  );

  return { skills: response.data.skills ?? [] };
}

export function emptyHooksResponse(): GetHooksResponse {
  return { hooks: [] };
}
