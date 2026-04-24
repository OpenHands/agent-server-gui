import React from "react";
import { useQuery } from "@tanstack/react-query";
import V1GitService from "#/api/git-service/v1-git-service.api";
import { useConversationId } from "#/hooks/use-conversation-id";
import { useActiveConversation } from "#/hooks/query/use-active-conversation";
import { useSettings } from "#/hooks/query/use-settings";
import { getGitPath } from "#/utils/get-git-path";
import { GitChangeStatus } from "#/api/open-hands.types";

type UseUnifiedGitDiffConfig = {
  filePath: string;
  type: GitChangeStatus;
  enabled: boolean;
};

/**
 * Unified hook to get git diff for both legacy (V0) and V1 conversations
 * - V0: Uses the legacy GitService.getGitChangeDiff API endpoint
 * - V1: Uses the V1GitService.getGitChangeDiff API endpoint with runtime URL
 */
export const useUnifiedGitDiff = (config: UseUnifiedGitDiffConfig) => {
  const { conversationId } = useConversationId();
  const { data: conversation } = useActiveConversation();
  const { data: settings } = useSettings();

  const conversationUrl = conversation?.conversation_url;
  const sessionApiKey = conversation?.session_api_key;
  const selectedRepository = conversation?.selected_repository;
  const workingDir = conversation?.workspace?.working_dir?.trim();

  // Sandbox grouping is enabled when strategy is not NO_GROUPING
  const useSandboxGrouping =
    settings?.sandbox_grouping_strategy !== "NO_GROUPING" &&
    settings?.sandbox_grouping_strategy !== undefined;

  const absoluteFilePath = React.useMemo(() => {
    const gitPath = getGitPath(
      conversationId,
      selectedRepository,
      useSandboxGrouping,
      workingDir,
    );
    return `${gitPath}/${config.filePath}`;
  }, [
    conversationId,
    selectedRepository,
    useSandboxGrouping,
    config.filePath,
    workingDir,
  ]);

  return useQuery({
    queryKey: [
      "file_diff",
      conversationId,
      conversationUrl,
      sessionApiKey,
      absoluteFilePath,
    ],
    queryFn: async () => {
      if (!conversationId) throw new Error("No conversation ID");

      return V1GitService.getGitChangeDiff(
        conversationUrl,
        sessionApiKey,
        absoluteFilePath,
      );
    },
    enabled: config.enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
};
