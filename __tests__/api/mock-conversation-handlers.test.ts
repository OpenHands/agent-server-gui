import { describe, expect, it } from "vitest";
import V1ConversationService from "#/api/conversation-service/v1-conversation-service.api";
import V1GitService from "#/api/git-service/v1-git-service.api";

describe("mock conversation handlers", () => {
  it("returns adapted conversations for batch lookups", async () => {
    const [conversation] = await V1ConversationService.batchGetAppConversations([
      "1",
    ]);

    expect(conversation?.id).toBe("1");
    expect(conversation?.title).toBe("My New Project");
    expect(conversation?.conversation_url).toContain("/api/conversations/1");
  });

  it("returns adapted conversation pages for search", async () => {
    const page = await V1ConversationService.searchConversations(10);

    expect(page.items.length).toBeGreaterThan(0);
    expect(page.next_page_id).toBeNull();
    expect(page.items[0]?.title).toBeTruthy();
  });

  it("returns empty git changes for mock conversations", async () => {
    const changes = await V1GitService.getGitChanges(
      "http://localhost:3000/api/conversations/1",
      null,
      "/workspace/project",
    );

    expect(changes).toEqual([]);
  });
});
