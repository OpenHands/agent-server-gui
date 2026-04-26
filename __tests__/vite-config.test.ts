import { execFile } from "node:child_process";
import process from "node:process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

describe("vite optimizeDeps", () => {
  it("prebundles core client entry dependencies", async () => {
    const { stdout } = await execFileAsync(
      process.execPath,
      [
        "-e",
        `import viteConfig from './vite.config.ts'; const config = await viteConfig({ mode: 'development', command: 'serve' }); console.log(JSON.stringify(config.optimizeDeps?.include ?? []));`,
      ],
      { cwd: process.cwd() },
    );

    const optimizedDeps = JSON.parse(stdout.trim()) as string[];

    expect(optimizedDeps).toEqual(
      expect.arrayContaining([
        "react",
        "react/jsx-runtime",
        "react-dom/client",
        "react-router/dom",
      ]),
    );
  });
});
