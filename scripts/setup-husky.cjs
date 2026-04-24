const { existsSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const repoRoot = process.cwd();
const initCwd = process.env.INIT_CWD;
const gitDir = path.join(repoRoot, ".git");

if (initCwd && path.resolve(initCwd) !== repoRoot) {
  process.exit(0);
}

if (!existsSync(gitDir)) {
  process.exit(0);
}

const result = spawnSync("npx", ["husky", ".husky"], {
  cwd: repoRoot,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
