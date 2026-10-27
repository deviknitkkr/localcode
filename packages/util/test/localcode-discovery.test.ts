import { expect, test } from "bun:test"
import path from "node:path"
import { configDirectories, projectConfigDirectories } from "../../tui/src/util/config-directories"

test("TUI resource discovery uses LocalCode project directories", () => {
  const project = path.resolve("project")
  const directory = path.join(project, "src")
  const global = path.resolve("config", "localcode")
  const directories = configDirectories(global, directory)
  expect(directories).toContain(global)
  expect(directories).toContain(path.join(project, ".localcode"))
  expect(directories).toContain(path.join(directory, ".localcode"))
  expect(directories.some((directory) => path.basename(directory) === ".opencode")).toBe(false)
  expect(projectConfigDirectories(project, directory)).toEqual([
    path.join(project, ".localcode"),
    path.join(directory, ".localcode"),
  ])
})
