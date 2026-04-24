import { AxiosHeaders } from "axios";
import { getAgentServerWorkingDir } from "../agent-server-config";
import {
  GetVSCodeUrlResponse,
  GetTrajectoryResponse,
  FileUploadSuccessResponse,
} from "../open-hands.types";
import { openHands } from "../open-hands-axios";
import { V1AppConversation } from "./v1-conversation-service.types";

class ConversationService {
  private static currentConversation: V1AppConversation | null = null;

  /**
   * Get a current conversation
   * @return the current conversation
   */
  static getCurrentConversation(): V1AppConversation | null {
    return this.currentConversation;
  }

  /**
   * Set a current conversation
   * @param url Custom URL to use for conversation endpoints
   */
  static setCurrentConversation(
    currentConversation: V1AppConversation | null,
  ): void {
    this.currentConversation = currentConversation;
  }

  /**
   * Get the url for the conversation. If
   */
  static getConversationUrl(conversationId: string): string {
    if (this.currentConversation?.id === conversationId) {
      if (this.currentConversation.conversation_url) {
        return this.currentConversation.conversation_url;
      }
    }
    return `/api/conversations/${conversationId}`;
  }

  static getConversationHeaders(): AxiosHeaders {
    const headers = new AxiosHeaders();
    const sessionApiKey = this.currentConversation?.session_api_key;
    if (sessionApiKey) {
      headers.set("X-Session-API-Key", sessionApiKey);
    }
    return headers;
  }

  /**
   * Get the VSCode URL
   * @returns VSCode URL
   */
  static async getVSCodeUrl(
    _conversationId: string,
  ): Promise<GetVSCodeUrlResponse> {
    const { data } = await openHands.get<{ url: string | null }>(
      "/api/vscode/url",
      {
        headers: this.getConversationHeaders(),
        params: {
          base_url:
            typeof window !== "undefined" ? window.location.origin : undefined,
          workspace_dir: getAgentServerWorkingDir(),
        },
      },
    );
    return { vscode_url: data.url };
  }

  static async getTrajectory(
    conversationId: string,
  ): Promise<GetTrajectoryResponse> {
    const { data } = await openHands.get<{ items: unknown[] }>(
      `/api/conversations/${conversationId}/events/search`,
      {
        headers: this.getConversationHeaders(),
        params: { limit: 10000 },
      },
    );
    return { trajectory: data.items ?? [] };
  }

  /**
   * Upload multiple files to the workspace
   * @param conversationId ID of the conversation
   * @param files List of files.
   * @returns list of uploaded files, list of skipped files
   */
  static async uploadFiles(
    _conversationId: string,
    files: File[],
  ): Promise<FileUploadSuccessResponse> {
    const uploaded_files: string[] = [];
    const skipped_files: { name: string; reason: string }[] = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        await openHands.post(
          `/api/file/upload?path=${encodeURIComponent(`/workspace/${file.name}`)}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              ...this.getConversationHeaders(),
            },
          },
        );
        uploaded_files.push(file.name);
      } catch (error) {
        skipped_files.push({
          name: file.name,
          reason: error instanceof Error ? error.message : "Upload failed",
        });
      }
    }

    return { uploaded_files, skipped_files };
  }
}

export default ConversationService;
