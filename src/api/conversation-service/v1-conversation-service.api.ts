import axios from "axios";
import { getAgentServerWorkingDir } from "../agent-server-config";
import { openHands } from "../open-hands-axios";
import { ConversationTrigger, GetVSCodeUrlResponse } from "../open-hands.types";
import { Provider } from "#/types/settings";
import { SuggestedTask } from "#/utils/types";
import { DirectConversationInfo, buildStartConversationRequest, downloadTextFile, emptyHooksResponse, loadSkillsForConversation, toV1AppConversation, toV1ConversationPage } from "../agent-server-adapter";
import type {
  V1SendMessageRequest,
  V1SendMessageResponse,
  V1AppConversationStartRequest,
  V1AppConversationStartTask,
  V1AppConversationStartTaskPage,
  V1AppConversation,
  V1AppConversationPage,
  GetSkillsResponse,
  GetHooksResponse,
  V1RuntimeConversationInfo,
  PluginSpec,
} from "./v1-conversation-service.types";
import SettingsService from "../settings-service/settings-service.api";

class V1ConversationService {
  static async sendMessage(
    conversationId: string,
    message: V1SendMessageRequest,
  ): Promise<V1SendMessageResponse> {
    await openHands.post(`/api/conversations/${conversationId}/events`, {
      ...message,
      run: true,
    });

    return message;
  }

  static async createConversation(
    _selectedRepository?: string,
    _git_provider?: Provider,
    initialUserMsg?: string,
    _selected_branch?: string,
    conversationInstructions?: string,
    _suggestedTask?: SuggestedTask,
    _trigger?: ConversationTrigger,
    _parent_conversation_id?: string,
    _agent_type?: "default" | "plan",
    plugins?: PluginSpec[],
    _sandbox_id?: string,
    _llm_model?: string,
  ): Promise<V1AppConversationStartTask> {
    const settings = await SettingsService.getSettings();
    const payload = buildStartConversationRequest({
      settings,
      query: initialUserMsg,
      conversationInstructions,
      plugins,
    });

    const { data } = await openHands.post<DirectConversationInfo>(
      "/api/conversations",
      payload,
    );

    return {
      id: data.id,
      created_by_user_id: null,
      status: "READY",
      detail: null,
      app_conversation_id: data.id,
      sandbox_id: data.id,
      agent_server_url: openHands.defaults.baseURL ?? null,
      request: {
        initial_message: payload.initial_message as
          | V1AppConversationStartRequest["initial_message"]
          | undefined,
        plugins: plugins ?? null,
      },
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  static async getStartTask(
    _taskId: string,
  ): Promise<V1AppConversationStartTask | null> {
    return null;
  }

  static async searchStartTasks(
    _limit: number = 100,
  ): Promise<V1AppConversationStartTask[]> {
    return [];
  }

  static async getVSCodeUrl(
    _conversationId: string,
    _conversationUrl: string | null | undefined,
    _sessionApiKey?: string | null,
  ): Promise<GetVSCodeUrlResponse> {
    const { data } = await openHands.get<{ url: string | null }>(
      "/api/vscode/url",
      {
        params: {
          base_url:
            typeof window !== "undefined" ? window.location.origin : undefined,
          workspace_dir: getAgentServerWorkingDir(),
        },
      },
    );
    return { vscode_url: data.url };
  }

  static async pauseConversation(
    conversationId: string,
    _conversationUrl: string | null | undefined,
    _sessionApiKey?: string | null,
  ): Promise<{ success: boolean }> {
    const { data } = await openHands.post<{ success: boolean }>(
      `/api/conversations/${conversationId}/pause`,
      {},
    );
    return data;
  }

  static async askAgent(
    conversationId: string,
    _conversationUrl: string | null | undefined,
    question: string,
    _sessionApiKey?: string | null,
  ): Promise<{ response: string }> {
    const { data } = await openHands.post<{ response: string }>(
      `/api/conversations/${conversationId}/ask_agent`,
      { question },
    );
    return data;
  }

  static async resumeConversation(
    conversationId: string,
    _conversationUrl: string | null | undefined,
    _sessionApiKey?: string | null,
  ): Promise<{ success: boolean }> {
    const { data } = await openHands.post<{ success: boolean }>(
      `/api/conversations/${conversationId}/run`,
      {},
    );
    return data;
  }

  static async batchGetAppConversations(
    ids: string[],
  ): Promise<(V1AppConversation | null)[]> {
    if (ids.length === 0) return [];

    const { data } = await openHands.get<(DirectConversationInfo | null)[]>(
      "/api/conversations",
      { params: { ids } },
    );

    return data.map((item) => (item ? toV1AppConversation(item) : null));
  }

  static async uploadFile(
    _conversationUrl: string | null | undefined,
    _sessionApiKey: string | null | undefined,
    file: File,
    path?: string,
  ): Promise<void> {
    const uploadPath = path || `/workspace/${file.name}`;
    const formData = new FormData();
    formData.append("file", file);
    await openHands.post(`/api/file/upload?path=${encodeURIComponent(uploadPath)}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  static async getConversationConfig(
    conversationId: string,
  ): Promise<{ runtime_id: string }> {
    return { runtime_id: conversationId };
  }

  static async updateConversationPublicFlag(
    conversationId: string,
    _isPublic: boolean,
  ): Promise<V1AppConversation> {
    const results = await this.batchGetAppConversations([conversationId]);
    return results[0] as V1AppConversation;
  }

  static async updateConversationRepository(
    conversationId: string,
    _repository: string | null,
    _branch?: string | null,
    _gitProvider?: string | null,
  ): Promise<V1AppConversation> {
    const results = await this.batchGetAppConversations([conversationId]);
    return results[0] as V1AppConversation;
  }

  static async readConversationFile(
    _conversationId: string,
    filePath: string = "/workspace/project/.agents_tmp/PLAN.md",
  ): Promise<string> {
    return downloadTextFile(filePath);
  }

  static async downloadConversation(conversationId: string): Promise<Blob> {
    const response = await openHands.get(`/api/file/download-trajectory/${conversationId}`, {
      responseType: "blob",
    });
    return response.data;
  }

  static async getSkills(conversationId: string): Promise<GetSkillsResponse> {
    const [conversation] = await this.batchGetAppConversations([conversationId]);
    return loadSkillsForConversation(conversation);
  }

  static async getHooks(_conversationId: string): Promise<GetHooksResponse> {
    return emptyHooksResponse();
  }

  static async getRuntimeConversation(
    conversationId: string,
    _conversationUrl: string | null | undefined,
    _sessionApiKey?: string | null,
  ): Promise<V1RuntimeConversationInfo> {
    const { data } = await openHands.get<DirectConversationInfo & { stats?: V1RuntimeConversationInfo["stats"] }>(
      `/api/conversations/${conversationId}`,
    );

    return {
      id: data.id,
      title: data.title ?? null,
      metrics: data.metrics
        ? {
            accumulated_cost: data.metrics.accumulated_cost ?? null,
            max_budget_per_task: data.metrics.max_budget_per_task ?? null,
            accumulated_token_usage: data.metrics.accumulated_token_usage
              ? {
                  prompt_tokens:
                    data.metrics.accumulated_token_usage.prompt_tokens ?? 0,
                  completion_tokens:
                    data.metrics.accumulated_token_usage.completion_tokens ?? 0,
                  cache_read_tokens:
                    data.metrics.accumulated_token_usage.cache_read_tokens ?? 0,
                  cache_write_tokens:
                    data.metrics.accumulated_token_usage.cache_write_tokens ?? 0,
                  context_window:
                    data.metrics.accumulated_token_usage.context_window ?? 0,
                  per_turn_token:
                    data.metrics.accumulated_token_usage.per_turn_token ?? 0,
                }
              : null,
          }
        : null,
      created_at: data.created_at,
      updated_at: data.updated_at,
      status: (data.execution_status as V1RuntimeConversationInfo["status"]) ?? "idle",
      stats: data.stats ?? { usage_to_metrics: {} },
    };
  }

  static async searchConversationsBySandboxId(
    sandboxId: string,
    limit: number = 100,
  ): Promise<V1AppConversation[]> {
    const page = await this.searchConversations(limit);
    return page.items.filter((item) => item.sandbox_id === sandboxId);
  }

  static async searchConversations(
    limit: number = 20,
    pageId?: string,
  ): Promise<V1AppConversationPage> {
    const { data } = await openHands.get<{
      items: DirectConversationInfo[];
      next_page_id: string | null;
    }>("/api/conversations/search", {
      params: {
        limit,
        page_id: pageId,
        sort_order: "UPDATED_AT_DESC",
      },
    });

    return toV1ConversationPage(data);
  }

  static async deleteConversation(conversationId: string): Promise<void> {
    await openHands.delete(`/api/conversations/${conversationId}`);
  }

  static async updateConversationTitle(
    conversationId: string,
    title: string,
  ): Promise<V1AppConversation> {
    await openHands.patch(`/api/conversations/${conversationId}`, { title });
    const [conversation] = await this.batchGetAppConversations([conversationId]);
    return conversation as V1AppConversation;
  }
}

export default V1ConversationService;
