import { openHands } from "../open-hands-axios";
import type {
  ConfirmationResponseRequest,
  ConfirmationResponseResponse,
} from "./event-service.types";
import { OpenHandsEvent } from "#/types/v1/core";

class EventService {
  static async respondToConfirmation(
    conversationId: string,
    _conversationUrl: string,
    request: ConfirmationResponseRequest,
    _sessionApiKey?: string | null,
  ): Promise<ConfirmationResponseResponse> {
    const { data } = await openHands.post<ConfirmationResponseResponse>(
      `/api/conversations/${conversationId}/events/respond_to_confirmation`,
      request,
    );

    return data;
  }

  static async getEventCount(
    conversationId: string,
    _conversationUrl: string,
    _sessionApiKey?: string | null,
  ): Promise<number> {
    const { data } = await openHands.get<number>(
      `/api/conversations/${conversationId}/events/count`,
    );
    return data;
  }

  static async searchEventsV1(conversationId: string, limit = 100) {
    const { data } = await openHands.get<{
      items: OpenHandsEvent[];
    }>(`/api/conversations/${conversationId}/events/search`, {
      params: { limit },
    });

    return data.items;
  }
}

export default EventService;
