import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useLocationMock = vi.fn();

vi.mock("react-router", async () => ({
  ...(await vi.importActual("react-router")),
  useLocation: () => useLocationMock(),
}));

describe("useIsOnIntermediatePage", () => {
  it("returns false for OSS app routes", async () => {
    useLocationMock.mockReturnValue({ pathname: "/settings" });
    const { useIsOnIntermediatePage } = await import(
      "#/hooks/use-is-on-intermediate-page"
    );

    const { result } = renderHook(() => useIsOnIntermediatePage());

    expect(result.current).toBe(false);
  });
});
