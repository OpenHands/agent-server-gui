import V1ConversationService from "../conversation-service/v1-conversation-service.api";
import type { V1SandboxInfo } from "./sandbox-service.types";
import { createSandboxInfo } from "../agent-server-adapter";

export class SandboxService {
  static async pauseSandbox(sandboxId: string): Promise<{ success: boolean }> {
    return V1ConversationService.pauseConversation(sandboxId, null, null);
  }

  static async resumeSandbox(sandboxId: string): Promise<{ success: boolean }> {
    return V1ConversationService.resumeConversation(sandboxId, null, null);
  }

  static async batchGetSandboxes(
    ids: string[],
  ): Promise<(V1SandboxInfo | null)[]> {
    const conversations = await V1ConversationService.batchGetAppConversations(ids);
    return conversations.map((conversation) =>
      conversation ? createSandboxInfo(conversation) : null,
    );
  }
}
