import { describe, expect, it, vi, beforeEach } from "vitest";
import V1ConversationService from "#/api/conversation-service/v1-conversation-service.api";

const {
  mockHttpGet,
  mockHttpPost,
  mockFileUpload,
  mockCreateHttpClient,
  mockCreateRemoteWorkspace,
} = vi.hoisted(() => ({
  mockHttpGet: vi.fn(),
  mockHttpPost: vi.fn(),
  mockFileUpload: vi.fn(),
  mockCreateHttpClient: vi.fn(),
  mockCreateRemoteWorkspace: vi.fn(),
}));

vi.mock("#/api/typescript-client", () => ({
  createHttpClient: mockCreateHttpClient,
  createRemoteWorkspace: mockCreateRemoteWorkspace,
  createVSCodeClient: vi.fn(),
}));

vi.mock("#/api/agent-server-config", () => ({
  getAgentServerBaseUrl: vi.fn(() => "http://localhost:54928"),
  getAgentServerSessionApiKey: vi.fn(() => "test-api-key"),
  getAgentServerWorkingDir: vi.fn(() => "/workspace/project/agent-server-gui"),
  getConfiguredWorkerUrls: vi.fn(() => []),
}));

describe("V1ConversationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpGet.mockReset();
    mockHttpPost.mockReset();
    mockFileUpload.mockReset();

    mockCreateHttpClient.mockReturnValue({
      get: mockHttpGet,
      post: mockHttpPost,
      patch: vi.fn(),
      delete: vi.fn(),
    });
    mockCreateRemoteWorkspace.mockReturnValue({
      fileUpload: mockFileUpload,
    });
  });

  describe("readConversationFile", () => {
    it("downloads the default plan path when filePath is not provided", async () => {
      const encodedPlan = new TextEncoder().encode("# PLAN content").buffer;
      mockHttpGet.mockResolvedValue({ data: encodedPlan });

      const content = await V1ConversationService.readConversationFile("conv-123");

      expect(content).toBe("# PLAN content");
      expect(mockCreateHttpClient).toHaveBeenCalledTimes(1);
      expect(mockHttpGet).toHaveBeenCalledWith(
        "/api/file/download",
        expect.objectContaining({
          params: { path: "/workspace/project/.agents_tmp/PLAN.md" },
          responseType: "arrayBuffer",
        }),
      );
    });
  });

  describe("uploadFile", () => {
    it("uses query params for file upload path", async () => {
      const file = new File(["test content"], "test.txt", { type: "text/plain" });
      const uploadPath = "/workspace/custom/path.txt";

      await V1ConversationService.uploadFile(
        "http://localhost:54928/api/conversations/conv-123",
        "test-api-key",
        file,
        uploadPath,
      );

      expect(mockCreateRemoteWorkspace).toHaveBeenCalledWith({
        sessionApiKey: "test-api-key",
      });
      expect(mockFileUpload).toHaveBeenCalledWith(file, uploadPath);
    });

    it("uses default workspace path when no path provided", async () => {
      const file = new File(["test content"], "myfile.txt", { type: "text/plain" });

      await V1ConversationService.uploadFile(
        "http://localhost:54928/api/conversations/conv-123",
        "test-api-key",
        file,
      );

      expect(mockFileUpload).toHaveBeenCalledWith(file, "/workspace/myfile.txt");
    });

    it("passes through the selected session key for uploads", async () => {
      const file = new File(["test content"], "test.txt", { type: "text/plain" });

      await V1ConversationService.uploadFile(
        "http://localhost:54928/api/conversations/conv-123",
        "my-session-key",
        file,
      );

      expect(mockCreateRemoteWorkspace).toHaveBeenCalledWith({
        sessionApiKey: "my-session-key",
      });
    });
  });
});
