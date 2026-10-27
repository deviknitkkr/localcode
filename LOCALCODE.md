# LocalCode

LocalCode keeps OpenCode's terminal interface and durable coding sessions while
focusing on local inference. This is an in-progress source fork, not a released
minimal distribution yet.

## Standalone downloads

The **LocalCode binaries** GitHub Actions workflow builds macOS Apple Silicon
and Linux x64 executables and uploads archives with SHA-256 checksums. Successful
builds can be attached to a GitHub prerelease. Download the archive for your OS,
extract it, and run `./localcode /path/to/project`. The Bun runtime is bundled;
neither Bun nor Node needs to be installed separately. Ollama or
another configured inference server must run separately.

macOS builds are initially unsigned and unnotarized. Use your machine's normal
approval process for downloaded applications. Linux x64 builds target glibc,
not Alpine/musl. These first releases are previews pending end-to-end testing.

## Run from source

Install the Bun version in `package.json`, then from the repository:

```sh
bun install
bun run dev /absolute/path/to/project
```

Resume the most recent session:

```sh
bun run dev /absolute/path/to/project --continue
```

Or resume a specific session with `--session <id>`. The TUI session picker also
opens saved sessions. Build and Plan are the default visible agents. Hidden
title, summary, and compaction agents support session housekeeping.

For a source-checkout launcher usable from any directory:

```sh
node /absolute/path/to/localcode/packages/cli/bin/localcode.cjs
```

`LOCALCODE_BUN` can select an explicit Bun executable. This launcher requires the
source checkout and installed dependencies; it is not an npm-distribution wrapper.

Build a native executable for the current machine:

```sh
bun run build
```

Output: `packages/cli/dist/cli-<platform>-<architecture>/bin/localcode` (with
`.exe` on Windows). Build each target on a machine supported by Bun/OpenTUI.
The CLI build omits the browser application and cloud model snapshot.

## Isolation

Default paths follow XDG base-directory overrides:

| Purpose                            | Default                     |
| ---------------------------------- | --------------------------- |
| Configuration                      | `~/.config/localcode/`      |
| Sessions, credentials, logs, plans | `~/.local/share/localcode/` |
| TUI state and locks                | `~/.local/state/localcode/` |
| Cache and downloaded utilities     | `~/.cache/localcode/`       |
| Project resources                  | `.localcode/`               |

Configuration files are `localcode.json` or `localcode.jsonc`, globally, in a
project, or inside `.localcode/`. UI preferences live in the global `cli.json`.
OpenCode configuration files, `.opencode/`, managed OpenCode preferences, and
shared `.claude/` and `.agents/` resource directories are not discovered.
Project `AGENTS.md` instructions still apply.

Normal launches use a private loopback child server on an allocated port. It
exits with the terminal client; sessions persist on disk. They do not discover
or replace the installed OpenCode service. `dev:live` now uses this isolated path.

Inherited `OPENCODE_*` settings are cleared at CLI startup. Use `LOCALCODE_*`
instead, for example `LOCALCODE_CONFIG`, `LOCALCODE_CONFIG_DIR`,
`LOCALCODE_CONFIG_CONTENT`, and `LOCALCODE_PRINT_LOGS`. Internally, compatibility
switches still use the upstream prefix, translated from LocalCode's environment.
Tracing is opt-in through `LOCALCODE_OTEL_ENDPOINT` and `LOCALCODE_OTEL_HEADERS`.
There is no upstream automatic updater.

## Ollama

Start Ollama separately and pull a tool-capable model. LocalCode discovers
installed local models on `http://127.0.0.1:11434`; Ollama cloud model entries
are excluded. No account or API key is required.

Use the TUI model picker, or set your exact installed tag globally:

```json
{
  "model": { "providerID": "ollama", "model": "your-installed-model:tag" },
  "providers": {
    "ollama": {
      "settings": { "baseURL": "http://127.0.0.1:11434/v1" },
      "models": {
        "your-installed-model:tag": {
          "limit": { "context": 32768, "output": 4096 }
        }
      }
    }
  }
}
```

Set Ollama's actual context window to the same value (for example through
`OLLAMA_CONTEXT_LENGTH` when starting Ollama, or a model's `num_ctx` parameter).
The model's advertised maximum does not configure Ollama. Discovery currently
reports that maximum, so explicitly override the context limit to match your
running Ollama server.

The current transport uses Ollama's `/v1/chat/completions` endpoint. Native
Ollama-only controls such as `keep_alive` and `num_ctx` are not new LocalCode
controls yet. Thinking and tool-calling behavior must be verified with each
model/template; a chat-capable model is not necessarily tool-capable.

## Other local or LAN model servers

LM Studio and vLLM retain their existing discovery. Any other OpenAI-compatible
server can be configured explicitly without a cloud catalog:

```json
{
  "model": { "providerID": "local", "model": "my-model" },
  "providers": {
    "local": {
      "name": "My local server",
      "settings": { "baseURL": "http://127.0.0.1:8080/v1", "apiKey": "" },
      "models": {
        "my-model": {
          "capabilities": { "tools": true, "input": ["text"], "output": ["text"] },
          "limit": { "context": 32768, "output": 4096 }
        }
      }
    }
  }
}
```

Set the endpoint, served model ID, capabilities, and effective context window
to match your server. Endpoints may use a LAN address; inference hardware is
independent of the machine running LocalCode.

## Skills and MCP

Put skills in `.localcode/skills/<name>/SKILL.md` or
`~/.config/localcode/skills/<name>/SKILL.md`. Existing SKILL.md frontmatter and
supporting files are supported. Skills are loaded on demand.

Local and remote MCP remain available, including remote authentication:

```json
{
  "mcp": {
    "servers": {
      "my-local-tools": { "type": "local", "command": ["node", "/path/to/server.js"] },
      "my-remote-tools": { "type": "remote", "url": "https://your-server.example/mcp" }
    }
  }
}
```

Use `bun run dev mcp add`, `mcp list`, and `mcp auth` for CLI management.

## Implementation status

Implemented: independent paths and environment boundary; private-server default;
local provider registration; one bundled chat adapter; Build/Plan and standard
coding tools; skills and MCP; removal of cloud catalog payload, upstream updater
implementation, hosted tunnel implementation, and browser assets from the CLI build.

Still to complete: removing unused product workspaces and manifests, remaining
upstream package/internal names and UI commands, remote-service/tunnel plumbing,
old provider source and tests, native Ollama options, and replacement release
packaging. The full workspace install is therefore still large. No binary-size,
startup, or idle-memory improvement is claimed without a verified build.

Registry authentication now works when Bun receives the expanded npm credential
through a temporary process environment. Most dependencies installed, but twelve
locked packages remain unavailable through the registry, including OpenTUI 0.7.0
and bun-types 1.4.4. Seven storage/environment/discovery tests and five Ollama
discovery tests pass on Bun 1.4.3. Full checks and live coding/MCP/session
verification still require the missing dependencies and pinned Bun version.

## Attribution

Forked from [OpenCode](https://github.com/anomalyco/opencode). Retained code is
covered by the repository's MIT [LICENSE](LICENSE).
