import { afterEach, describe, expect, it } from "vitest";
import {
  getAgentServerBaseUrl,
  getCloudDevelopmentWarning,
  isLikelyOpenHandsCloudRuntime,
} from "#/api/agent-server-config";

const STORAGE_KEY = "openhands-agent-server-config";
const ORIGINAL_LOCATION = window.location;

function mockWindowLocation(url: string) {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: new URL(url),
  });
}

afterEach(() => {
  window.localStorage.clear();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: ORIGINAL_LOCATION,
  });
});

describe("getAgentServerBaseUrl", () => {
  it("uses the browser origin when a remote browser is pointed at localhost backend config", () => {
    mockWindowLocation("https://work-1.example.dev/settings");
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ baseUrl: "http://127.0.0.1:8000" }),
    );

    expect(getAgentServerBaseUrl()).toBe("https://work-1.example.dev");
  });

  it("preserves a non-local backend URL from stored config", () => {
    mockWindowLocation("https://work-1.example.dev/settings");
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ baseUrl: "https://agent.example.com" }),
    );

    expect(getAgentServerBaseUrl()).toBe("https://agent.example.com");
  });
});

describe("OpenHands Cloud runtime detection", () => {
  it("detects OpenHands Cloud runtime hosts", () => {
    mockWindowLocation("https://work-1.example.prod-runtime.all-hands.dev/");

    expect(isLikelyOpenHandsCloudRuntime()).toBe(true);
    expect(getCloudDevelopmentWarning()).toContain(
      "do not start a second `agent-server`",
    );
  });

  it("does not warn for non-OpenHands hosts", () => {
    mockWindowLocation("https://frontend.example.com/");

    expect(isLikelyOpenHandsCloudRuntime()).toBe(false);
    expect(getCloudDevelopmentWarning()).toBeNull();
  });
});
