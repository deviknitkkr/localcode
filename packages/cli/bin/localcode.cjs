#!/usr/bin/env node
const path = require("node:path")
const { spawnSync } = require("node:child_process")

const result = spawnSync(
  process.env.LOCALCODE_BUN || "bun",
  [path.join(__dirname, "../src/index.ts"), ...process.argv.slice(2)],
  {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, LOCALCODE_DIRECTORY: process.env.LOCALCODE_DIRECTORY || process.cwd() },
    stdio: "inherit",
  },
)
if (result.error) {
  process.stderr.write(
    `Could not start LocalCode: ${result.error.message}\nInstall Bun and run bun install from the repository first.\n`,
  )
}
process.exit(result.status ?? 1)
