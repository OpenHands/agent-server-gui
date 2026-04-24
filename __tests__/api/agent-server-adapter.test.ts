import { describe, expect, it, vi } from "vitest";

const { mockGetAgentServerWorkingDir } = vi.hoisted(() => ({
  mockGetAgentServerWorkingDir: vi.fn(() => "/workspace/project/agent-server-gui"),
}));

vi.mock("#/api/agent-server-config", () => ({
  getAgentServerBaseUrl: vi.fn(() => "http://127.0.0.1:8000"),
  getAgentServerSessionApiKey: vi.fn(() => null),
  getAgentServerWorkingDir: mockGetAgentServerWorkingDir,
  getConfiguredWorkerUrls: vi.fn(() => []),
}));

import { buildStartConversationRequest } from "#/api/agent-server-adapter";
import { DEFAULT_SETTINGS } from "#/services/settings";

describe("buildStartConversationRequest", () => {
  it("uses the SDK-registered tool names for live agent-server conversations", () => {
    const payload = buildStartConversationRequest({
      settings: {
        ...DEFAULT_SETTINGS,
        llm_model: "litellm_proxy/claude-opus-4-5-20251101",
      },
      query: "hello",
    }) as {
      agent: { tools: Array<{ name: string; params: Record<string, unknown> }> };
      workspace: { working_dir: string };
      initial_message: { content: Array<{ text: string }> };
    };

    expect(payload.agent.tools).toEqual([
      { name: "terminal", params: {} },
      { name: "file_editor", params: {} },
      { name: "task_tracker", params: {} },
      { name: "browser_tool_set", params: {} },
    ]);
    expect(payload.workspace.working_dir).toBe(
      "/workspace/project/agent-server-gui",
    );
    expect(payload.initial_message.content[0]?.text).toBe("hello");
  });
});
