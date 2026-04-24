import { mapAnyGitStatusToV0Status } from "#/utils/git-status-mapper";
import type { GitChange, GitChangeDiff } from "../open-hands.types";
import { createRemoteWorkspace } from "../typescript-client";

class V1GitService {
  static async getGitChanges(
    conversationUrl: string | null | undefined,
    sessionApiKey: string | null | undefined,
    path: string,
  ): Promise<GitChange[]> {
    const changes = await createRemoteWorkspace({
      conversationUrl,
      sessionApiKey,
    }).gitChanges(path);

    if (!Array.isArray(changes)) {
      throw new Error("Invalid response from runtime - runtime may be unavailable");
    }

    return changes.map((change) => ({
      status: mapAnyGitStatusToV0Status(
        String(change.status) as Parameters<typeof mapAnyGitStatusToV0Status>[0],
      ),
      path: change.path,
    }));
  }

  static async getGitChangeDiff(
    conversationUrl: string | null | undefined,
    sessionApiKey: string | null | undefined,
    path: string,
  ): Promise<GitChangeDiff> {
    const diff = await createRemoteWorkspace({
      conversationUrl,
      sessionApiKey,
    }).gitDiff(path);

    return {
      modified: diff.modified ?? "",
      original: diff.original ?? "",
      ...(diff.diff ? { diff: diff.diff } : {}),
    };
  }
}

export default V1GitService;
