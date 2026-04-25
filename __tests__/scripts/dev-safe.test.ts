import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildSafeDevConfig } from "../../scripts/dev-safe.mjs";

describe("buildSafeDevConfig", () => {
  it("builds isolated default paths and ports", () => {
    const cwd = "/workspace/project/agent-server-gui";

    const config = buildSafeDevConfig(cwd, {});

    expect(config.backendPort).toBe(18000);
    expect(config.vscodePort).toBe(18001);
    expect(config.backendBaseUrl).toBe("http://127.0.0.1:18000");
    expect(config.backendHost).toBe("127.0.0.1:18000");
    expect(config.workingDir).toBe(cwd);
    expect(config.stateDir).toBe(path.join(cwd, ".openhands-dev", "safe-dev-18000"));
    expect(config.tmuxTmpDir).toBe(path.join(config.stateDir, "tmux"));
    expect(config.conversationsPath).toBe(
      path.join(config.stateDir, "conversations"),
    );
    expect(config.bashEventsDir).toBe(path.join(config.stateDir, "bash_events"));
  });

  it("honors environment overrides", () => {
    const cwd = "/workspace/project/agent-server-gui";

    const config = buildSafeDevConfig(cwd, {
      OH_GUI_SAFE_BACKEND_PORT: "19000",
      OH_GUI_SAFE_VSCODE_PORT: "19010",
      OH_GUI_SAFE_STATE_DIR: ".tmp/dev-safe",
      VITE_WORKING_DIR: "/workspace/custom-repo",
    });

    expect(config.backendPort).toBe(19000);
    expect(config.vscodePort).toBe(19010);
    expect(config.backendBaseUrl).toBe("http://127.0.0.1:19000");
    expect(config.backendHost).toBe("127.0.0.1:19000");
    expect(config.stateDir).toBe(path.join(cwd, ".tmp", "dev-safe"));
    expect(config.workingDir).toBe("/workspace/custom-repo");
  });
});
