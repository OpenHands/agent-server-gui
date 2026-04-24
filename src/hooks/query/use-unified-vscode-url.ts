import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useConversationId } from "#/hooks/use-conversation-id";
import { I18nKey } from "#/i18n/declaration";
import ConversationService from "#/api/conversation-service/conversation-service.api";
import V1ConversationService from "#/api/conversation-service/v1-conversation-service.api";
import { transformVSCodeUrl } from "#/utils/vscode-url-helper";
import { useRuntimeIsReady } from "#/hooks/use-runtime-is-ready";

interface VSCodeUrlResult {
  url: string | null;
  error: string | null;
}

/**
 * Unified hook to get a VSCode URL.
 *
 * In direct agent_server mode we ask `/api/vscode/url` directly instead of
 * relying on sandbox `exposed_urls`, because newer agent_server-compatible
 * clients expose VSCode as a dedicated API.
 */
export const useUnifiedVSCodeUrl = () => {
  const { t } = useTranslation();
  const { conversationId } = useConversationId();
  const runtimeIsReady = useRuntimeIsReady({ allowAgentError: true });

  const mainQuery = useQuery<VSCodeUrlResult>({
    queryKey: ["unified", "vscode_url", conversationId],
    queryFn: async () => {
      if (!conversationId) throw new Error("No conversation ID");

      const response = await V1ConversationService.getVSCodeUrl(
        conversationId,
        null,
        null,
      ).catch(() => ConversationService.getVSCodeUrl(conversationId));

      return {
        url: transformVSCodeUrl(response.vscode_url),
        error: response.vscode_url
          ? null
          : t(I18nKey.VSCODE$URL_NOT_AVAILABLE),
      };
    },
    enabled: runtimeIsReady && !!conversationId,
    refetchOnMount: true,
    retry: 3,
  });

  return {
    data: mainQuery.data,
    error: mainQuery.error,
    isLoading: mainQuery.isLoading,
    isError: mainQuery.isError,
    isSuccess: mainQuery.isSuccess,
    status: mainQuery.status,
    refetch: mainQuery.refetch,
  };
};
