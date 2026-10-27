// Run before loading the upstream runtime graph. Its internal switches still use
// OPENCODE_ names; only explicitly supplied LOCALCODE_ values may reach them.
const entries = Object.entries(process.env)
for (const [name] of entries) {
  if (name.startsWith("OPENCODE_")) delete process.env[name]
}
for (const [name, value] of entries) {
  if (name.startsWith("LOCALCODE_") && value !== undefined) {
    process.env[`OPENCODE_${name.slice("LOCALCODE_".length)}`] = value
  }
}
if (process.env.LOCALCODE_DIRECTORY) {
  process.chdir(process.env.LOCALCODE_DIRECTORY)
  delete process.env.LOCALCODE_DIRECTORY
  delete process.env.OPENCODE_DIRECTORY
}
