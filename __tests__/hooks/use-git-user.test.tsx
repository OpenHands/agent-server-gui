import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useGitUser } from "#/hooks/query/use-git-user";
import UserService from "#/api/user-service/user-service.api";
import * as useShouldShowUserFeaturesModule from "#/hooks/use-should-show-user-features";
import * as useConfigModule from "#/hooks/query/use-config";
import { AxiosError } from "axios";

vi.mock("#/hooks/use-should-show-user-features");
vi.mock("#/hooks/query/use-config");
vi.mock("#/api/user-service/user-service.api");

const identifyMock = vi.fn();

vi.mock("posthog-js/react", () => ({
  usePostHog: vi.fn(() => ({
    identify: identifyMock,
  })),
}));

describe("useGitUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useShouldShowUserFeaturesModule.useShouldShowUserFeatures).mockReturnValue(true);
    vi.mocked(useConfigModule.useConfig).mockReturnValue({
      data: { app_mode: "oss" },
      isLoading: false,
      error: null,
    } as any);
  });

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  it("keeps OSS git-user failures local when the backend returns 401", async () => {
    const mockError = new AxiosError("Unauthorized", "401", undefined, undefined, {
      status: 401,
      data: { message: "Unauthorized" },
    } as any);

    vi.mocked(UserService.getUser).mockRejectedValue(mockError);

    const { result } = renderHook(() => useGitUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });

    expect(identifyMock).not.toHaveBeenCalled();
  });

  it("identifies the user when the git profile loads successfully", async () => {
    vi.mocked(UserService.getUser).mockResolvedValue({
      login: "octocat",
      company: "GitHub",
      name: "The Octocat",
      email: "octocat@example.com",
    } as never);

    const { result } = renderHook(() => useGitUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });

    expect(identifyMock).toHaveBeenCalledWith("octocat", {
      company: "GitHub",
      name: "The Octocat",
      email: "octocat@example.com",
      user: "octocat",
      mode: "oss",
    });
  });
});
