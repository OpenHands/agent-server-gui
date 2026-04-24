import { openHands } from "../open-hands-axios";
import type {
  PendingMessageResponse,
  QueuePendingMessageRequest,
} from "./pending-message-service.types";

class PendingMessageService {
  static async queueMessage(
    conversationId: string,
    message: QueuePendingMessageRequest,
  ): Promise<PendingMessageResponse> {
    await openHands.post(`/api/conversations/${conversationId}/events`, {
      ...message,
      role: "user",
      run: true,
    });

    return {
      id: `${conversationId}:${Date.now()}`,
      queued: true,
      position: 1,
    };
  }
}

export default PendingMessageService;
