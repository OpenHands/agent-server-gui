import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "#/mocks/node";
import "@testing-library/jest-dom/vitest";

if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = vi.fn();
}

if (typeof HTMLElement !== "undefined") {
  HTMLElement.prototype.scrollTo = vi.fn();
}

const windowStub =
  typeof window === "undefined"
    ? ({ event: undefined } as unknown as Window & typeof globalThis)
    : window;

vi.stubGlobal("window", windowStub);
windowStub.scrollTo = vi.fn();

if (typeof requestAnimationFrame === "undefined") {
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    setTimeout(() => callback(0), 0),
  );
  vi.stubGlobal(
    "cancelAnimationFrame",
    (timeoutId: ReturnType<typeof setTimeout>) => clearTimeout(timeoutId),
  );
}

// Mock ResizeObserver for test environment
class MockResizeObserver {
  observe = vi.fn();

  unobserve = vi.fn();

  disconnect = vi.fn();
}

// Mock the i18n provider
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: "en",
      exists: () => false,
    },
  }),
}));

vi.mock("#/hooks/use-is-on-tos-page", () => ({
  useIsOnTosPage: () => false,
}));

vi.mock("#/hooks/use-is-on-intermediate-page", () => ({
  useIsOnIntermediatePage: () => false,
}));

// Mock useRevalidator from react-router to allow direct store manipulation
// in tests instead of mocking useSelectedOrganizationId hook
vi.mock("react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router")>()),
  useRevalidator: () => ({
    revalidate: vi.fn(),
  }),
}));

// Import the Zustand mock to enable automatic store resets
vi.mock("zustand");

// Mock requests during tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: "bypass" });
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
});
afterEach(() => {
  server.resetHandlers();
  // Cleanup the document body after each test
  cleanup();
});
afterAll(() => {
  server.close();
  vi.unstubAllGlobals();
});
