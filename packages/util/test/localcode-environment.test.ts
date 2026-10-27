import { expect, test } from "bun:test"
import path from "node:path"

test("LocalCode ignores inherited OpenCode settings and translates only its own switches", () => {
  const result = Bun.spawnSync({
    cmd: [
      process.execPath,
      "-e",
      `await import(${JSON.stringify(path.resolve(import.meta.dirname, "../../cli/src/localcode.ts"))});
       process.stdout.write(JSON.stringify({
         config: process.env.OPENCODE_CONFIG,
         password: process.env.OPENCODE_PASSWORD,
         drive: process.env.OPENCODE_DRIVE,
         local: process.env.LOCALCODE_CONFIG,
         unrelated: process.env.LOCALCODE_TEST_SENTINEL
       }))`,
    ],
    env: {
      ...process.env,
      OPENCODE_CONFIG: "/managed/opencode.json",
      OPENCODE_PASSWORD: "managed-secret",
      OPENCODE_DRIVE: "1",
      LOCALCODE_CONFIG: "/personal/localcode.json",
      LOCALCODE_TEST_SENTINEL: "preserved",
    },
    stdout: "pipe",
    stderr: "pipe",
  })
  expect(result.exitCode, result.stderr.toString()).toBe(0)
  expect(JSON.parse(result.stdout.toString())).toEqual({
    config: "/personal/localcode.json",
    local: "/personal/localcode.json",
    unrelated: "preserved",
  })
})
