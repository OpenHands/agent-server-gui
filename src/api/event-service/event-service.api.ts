import { OpenHandsEvent } from "#/types/v1/core";
import { createHttpClient, createRemoteEventsList } from "../typescript-client";
import type {
  ConfirmationResponseRequest,
  ConfirmationResponseResponse,
} from "./event-service.types";

class EventService {
  static async respondToConfirmation(
    conversationId: string,
    _conversationUrl: string,
    request: ConfirmationResponseRequest,
    sessionApiKey?: string | null,
  ): Promise<ConfirmationResponseResponse> {
    const response = await createHttpClient({ sessionApiKey }).post<ConfirmationResponseResponse>(
      `/api/conversations/${conversationId}/events/respond_to_confirmation`,
      request,
    );

    return response.data;
  }

  static async getEventCount(
    conversationId: string,
    _conversationUrl: string,
    sessionApiKey?: string | null,
  ): Promise<number> {
    return createRemoteEventsList(conversationId, { sessionApiKey }).count();
  }

  static async searchEventsV1(
    conversationId: string,
    limit = 100,
    sessionApiKey?: string | null,
  ) {
    const page = await createRemoteEventsList(conversationId, { sessionApiKey }).search({
      limit,
    });

    return (page.items ?? []) as OpenHandsEvent[];
  }
}

export default EventService;
