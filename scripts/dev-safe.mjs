import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";

const DEFAULT_BACKEND_PORT = 18000;
const DEFAULT_WAIT_TIMEOUT_MS = 30_000;

function parsePort(value, fallback) {
  if (value == null || value === "") {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid port: ${value}`);
  }

  return parsed;
}

export function buildSafeDevConfig(cwd = process.cwd(), env = process.env) {
  const backendPort = parsePort(env.OH_GUI_SAFE_BACKEND_PORT, DEFAULT_BACKEND_PORT);
  const vscodePort = parsePort(env.OH_GUI_SAFE_VSCODE_PORT, backendPort + 1);
  const stateDir = path.resolve(
    cwd,
    env.OH_GUI_SAFE_STATE_DIR || path.join(".openhands-dev", `safe-dev-${backendPort}`),
  );

  return {
    cwd,
    backendPort,
    vscodePort,
    stateDir,
    tmuxTmpDir: path.join(stateDir, "tmux"),
    conversationsPath: path.join(stateDir, "conversations"),
    bashEventsDir: path.join(stateDir, "bash_events"),
    backendBaseUrl: `http://127.0.0.1:${backendPort}`,
    backendHost: `127.0.0.1:${backendPort}`,
    workingDir: env.VITE_WORKING_DIR || cwd,
  };
}

async function waitForServer(url, timeoutMs = DEFAULT_WAIT_TIMEOUT_MS) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling until timeout.
    }

    await delay(500);
  }

  throw new Error(`Timed out waiting for agent-server at ${url}`);
}

function spawnProcess(command, args, options) {
  const child = spawn(command, args, { stdio: "inherit", ...options });

  child.once("error", (error) => {
    if ((error && "code" in error && error.code === "ENOENT") || /ENOENT/.test(String(error))) {
      console.error(`Failed to start ${command}. Make sure it is installed and on your PATH.`);
    } else {
      console.error(`Failed to start ${command}:`, error);
    }
  });

  return child;
}

async function main() {
  const config = buildSafeDevConfig();

  for (const dir of [
    config.stateDir,
    config.tmuxTmpDir,
    config.conversationsPath,
    config.bashEventsDir,
  ]) {
    mkdirSync(dir, { recursive: true });
  }

  console.log("Starting isolated agent-server + frontend dev stack...");
  console.log(`- backend: ${config.backendBaseUrl}`);
  console.log(`- vscode port: ${config.vscodePort}`);
  console.log(`- working dir: ${config.workingDir}`);
  console.log(`- isolated state dir: ${config.stateDir}`);
  console.log("");

  const backend = spawnProcess(
    "agent-server",
    ["--host", "127.0.0.1", "--port", String(config.backendPort)],
    {
      cwd: config.cwd,
      env: {
        ...process.env,
        TMUX_TMPDIR: config.tmuxTmpDir,
        OH_CONVERSATIONS_PATH: config.conversationsPath,
        OH_BASH_EVENTS_DIR: config.bashEventsDir,
        OH_VSCODE_PORT: String(config.vscodePort),
      },
    },
  );

  let shuttingDown = false;
  let frontend = null;

  const shutdown = (signal = "SIGTERM") => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    frontend?.kill(signal);
    backend.kill(signal);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  const backendErrored = new Promise((_, reject) => {
    backend.once("error", (error) => reject(error));
  });
  const backendExited = new Promise((_, reject) => {
    backend.once("exit", (code, signal) => {
      if (!shuttingDown) {
        reject(
          new Error(
            `agent-server exited before startup completed (code=${code ?? "null"}, signal=${signal ?? "null"})`,
          ),
        );
      }
    });
  });

  try {
    await Promise.race([
      waitForServer(`${config.backendBaseUrl}/server_info`),
      backendErrored,
      backendExited,
    ]);
  } catch (error) {
    shutdown();
    throw error;
  }

  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  frontend = spawnProcess(npmCommand, ["run", "dev:frontend"], {
    cwd: config.cwd,
    env: {
      ...process.env,
      VITE_BACKEND_HOST: config.backendHost,
      VITE_BACKEND_BASE_URL: config.backendBaseUrl,
      VITE_WORKING_DIR: config.workingDir,
    },
  });

  frontend.once("exit", (code) => {
    shutdown();
    process.exitCode = code ?? 0;
  });

  backend.once("exit", (code) => {
    if (!shuttingDown) {
      console.error(`agent-server exited unexpectedly with code ${code ?? 0}`);
      shutdown();
      process.exitCode = code ?? 1;
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
