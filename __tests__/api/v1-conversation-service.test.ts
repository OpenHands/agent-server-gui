import { describe, expect, it, vi, beforeEach, afterEach, Mock } from "vitest";
import axios from "axios";
import V1ConversationService from "#/api/conversation-service/v1-conversation-service.api";

const { mockAxiosGet, mockOpenHandsPost } = vi.hoisted(() => ({
  mockAxiosGet: vi.fn(),
  mockOpenHandsPost: vi.fn(),
}));

vi.mock("#/api/open-hands-axios", () => ({
  openHands: { post: mockOpenHandsPost },
}));

vi.mock("#/api/agent-server-config", () => ({
  getAgentServerBaseUrl: vi.fn(() => "http://localhost:54928"),
  getAgentServerSessionApiKey: vi.fn(() => "test-api-key"),
  getAgentServerWorkingDir: vi.fn(() => "/workspace/project/agent-server-gui"),
  getConfiguredWorkerUrls: vi.fn(() => []),
}));

vi.mock("axios");

describe("V1ConversationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (axios.get as Mock).mockImplementation(mockAxiosGet);
    mockOpenHandsPost.mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("readConversationFile", () => {
    it("downloads the default plan path when filePath is not provided", async () => {
      const encodedPlan = new TextEncoder().encode("# PLAN content");
      mockAxiosGet.mockResolvedValue({ data: encodedPlan });

      const content = await V1ConversationService.readConversationFile("conv-123");

      expect(content).toBe("# PLAN content");
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith(
        "http://localhost:54928/api/file/download",
        expect.objectContaining({
          params: { path: "/workspace/project/.agents_tmp/PLAN.md" },
          responseType: "arraybuffer",
          headers: { "X-Session-API-Key": "test-api-key" },
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

      expect(mockOpenHandsPost).toHaveBeenCalledTimes(1);
      const callUrl = mockOpenHandsPost.mock.calls[0][0] as string;
      expect(callUrl).toContain("/api/file/upload?");
      expect(callUrl).toContain("path=%2Fworkspace%2Fcustom%2Fpath.txt");
      expect(callUrl).not.toContain("/api/file/upload/%2F");
    });

    it("uses default workspace path when no path provided", async () => {
      const file = new File(["test content"], "myfile.txt", { type: "text/plain" });

      await V1ConversationService.uploadFile(
        "http://localhost:54928/api/conversations/conv-123",
        "test-api-key",
        file,
      );

      expect(mockOpenHandsPost).toHaveBeenCalledTimes(1);
      const callUrl = mockOpenHandsPost.mock.calls[0][0] as string;
      expect(callUrl).toContain("path=%2Fworkspace%2Fmyfile.txt");
    });

    it("sends file as FormData with multipart headers", async () => {
      const file = new File(["test content"], "test.txt", { type: "text/plain" });

      await V1ConversationService.uploadFile(
        "http://localhost:54928/api/conversations/conv-123",
        "test-api-key",
        file,
      );

      expect(mockOpenHandsPost).toHaveBeenCalledTimes(1);
      const callArgs = mockOpenHandsPost.mock.calls[0];
      const formData = callArgs[1];
      expect(formData).toBeInstanceOf(FormData);
      expect(formData.get("file")).toBe(file);
      expect(callArgs[2].headers).toEqual({
        "Content-Type": "multipart/form-data",
      });
    });
  });
});
