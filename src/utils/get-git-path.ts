/**
 * Get the git repository path for a conversation.
 *
 * If the backend provides an explicit workspace path for the conversation,
 * prefer that over frontend heuristics.
 *
 * Otherwise, when sandbox grouping is enabled (strategy != NO_GROUPING), each
 * conversation gets its own subdirectory: /workspace/project/{conversationId}[/{repoName}]
 *
 * When sandbox grouping is disabled (NO_GROUPING), the path is simply:
 * /workspace/project[/{repoName}]
 */
export function getGitPath(
  conversationId: string,
  selectedRepository: string | null | undefined,
  useSandboxGrouping: boolean = false,
  workingDir?: string | null,
): string {
  const normalizedWorkingDir = workingDir?.trim();
  if (normalizedWorkingDir) {
    return normalizedWorkingDir;
  }

  const basePath = useSandboxGrouping
    ? `/workspace/project/${conversationId}`
    : "/workspace/project";

  if (!selectedRepository) {
    return basePath;
  }

  const parts = selectedRepository.split("/");
  const repoName = parts[parts.length - 1];

  return `${basePath}/${repoName}`;
}
