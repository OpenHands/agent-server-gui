import { openHands } from "../open-hands-axios";
import { RepositoryPage, BranchPage, InstallationPage } from "#/types/git";
import { GitChange, GitChangeDiff } from "../open-hands.types";
import { getAgentServerWorkingDir } from "../agent-server-config";

class GitService {
  static async searchGitRepositories(
    _query: string,
    _provider: string,
    _limit = 100,
    _pageId?: string,
    _installationId?: string,
  ): Promise<RepositoryPage> {
    return { items: [], next_page_id: null };
  }

  static async retrieveUserGitRepositories(
    _provider: string,
    _pageId?: string,
    _limit = 30,
    _installationId?: string,
  ): Promise<RepositoryPage> {
    return { items: [], next_page_id: null };
  }

  static async retrieveInstallationRepositories(
    _provider: string,
    _installationIndex: number,
    _installations: string[],
    _pageId?: string,
    _limit = 30,
  ): Promise<RepositoryPage> {
    return { items: [], next_page_id: null };
  }

  static async getRepositoryBranches(
    _repository: string,
    _provider: string,
    _query: string = "",
    _pageId?: string,
    _limit = 30,
  ): Promise<BranchPage> {
    return { items: [], next_page_id: null };
  }

  static async searchRepositoryBranches(
    repository: string,
    provider: string,
    query: string,
    pageId?: string,
    limit = 30,
  ): Promise<BranchPage> {
    return this.getRepositoryBranches(repository, provider, query, pageId, limit);
  }

  static async getUserInstallations(
    _provider: string,
    _pageId?: string,
    _limit = 100,
  ): Promise<InstallationPage> {
    return { items: [], next_page_id: null };
  }

  static async getGitChanges(_conversationId: string): Promise<GitChange[]> {
    const { data } = await openHands.get<GitChange[]>("/api/git/changes", {
      params: { path: getAgentServerWorkingDir() },
    });
    return data;
  }

  static async getGitChangeDiff(
    _conversationId: string,
    path: string,
  ): Promise<GitChangeDiff> {
    const { data } = await openHands.get<GitChangeDiff>("/api/git/diff", {
      params: { path },
    });
    return data;
  }
}

export default GitService;
