# LocalCode

A local-model-focused terminal coding agent, forked from OpenCode. Start with
[the LocalCode setup guide](LOCALCODE.md) for Ollama, compatible endpoints,
skills, MCP, isolated storage, and the current implementation status.

## Clean installation

1. Open [LocalCode releases](https://github.com/deviknitkkr/localcode/releases)
   and download the archive and matching `.sha256` file for your machine:
   | Laptop | Release asset |
   | --- | --- |
   | Windows Intel/AMD x64 | `localcode-windows-x64.zip` |
   | Windows ARM64 | `localcode-windows-arm64.zip` |
   | Linux Intel/AMD x64 (glibc) | `localcode-linux-x64.tar.gz` |
   | Linux ARM64 (glibc) | `localcode-linux-arm64.tar.gz` |
   | Apple Silicon Mac | `localcode-darwin-arm64.tar.gz` |
   | Intel Mac | `localcode-darwin-x64.tar.gz` |

   Release downloads do not require a GitHub login and do not have the 14-day
   Actions artifact expiry. All targets build on Linux without waiting for
   Mac or Windows runners. Linux x64 receives runtime smoke tests; other targets
   receive architecture and bundle checks.

2. Follow your platform's steps below from the download directory.
   Development builds are also available as expiring ZIP artifacts under
   [Actions](https://github.com/deviknitkkr/localcode/actions/workflows/localcode-build.yml);
   extract that outer ZIP first if using one of those builds.
3. Install [Ollama](https://ollama.com/download) separately, start it, and install
   a tool-capable model that fits the laptop's memory (for example,
   `ollama pull qwen3:4b`). Then run `localcode` in your project and select the
   model. Bun and Node are not required separately. Git is recommended for
   working with repositories.

### macOS and Linux

In the download directory (Apple Silicon example):

```sh
shasum -a 256 localcode-darwin-arm64.tar.gz
# Compare with the hash in localcode-darwin-arm64.sha256.
tar -xzf localcode-darwin-arm64.tar.gz
mkdir -p "$HOME/.local/bin"
install -m 755 localcode "$HOME/.local/bin/localcode"
export PATH="$HOME/.local/bin:$PATH"
localcode --version
```

Use the platform from the table in place of `darwin-arm64`, for example
`linux-x64` or `darwin-x64`. Add `export PATH="$HOME/.local/bin:$PATH"` to
`~/.zshrc` (zsh) or `~/.bashrc` (bash) for future terminals.
Mac binaries are currently unsigned and unnotarized. Linux builds require
glibc; Alpine/musl is not included in this workflow.

```sh
localcode /path/to/project
```

### Windows (PowerShell)

In the download directory (x64 example):

```powershell
Get-FileHash .\localcode-windows-x64.zip -Algorithm SHA256
# Compare with the hash in localcode-windows-x64.sha256.
$bin = Join-Path $env:LOCALAPPDATA "LocalCode\bin"
New-Item -ItemType Directory -Force $bin | Out-Null
Expand-Archive .\localcode-windows-x64.zip -DestinationPath $bin -Force
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if (($userPath -split ';') -notcontains $bin) {
  [Environment]::SetEnvironmentVariable("Path", "$userPath;$bin", "User")
}
$env:Path = "$bin;$env:Path"
localcode --version
localcode C:\path\to\project
```

For Windows ARM64, substitute `windows-arm64` for `windows-x64`. Use Windows
Terminal/PowerShell. Cross-built Windows binaries have architecture and bundle
checks but have not yet been runtime-tested on Windows.

### Moving settings to another laptop

Run `localcode debug paths config` on each machine to find the config directory.
Copy `localcode.json` and any custom skills/MCP config into the destination
directory. Update model tags, endpoint addresses, and machine-specific MCP paths.
Pull models separately on the new machine, or configure a reachable LAN endpoint.
Ollama's KV-cache environment settings are separate and must be configured on
the inference machine. Choose a context window that fits its memory; the example
below is not a hardware-independent recommendation.

To update LocalCode, close it and repeat the binary installation with a newer
artifact; saved settings and sessions remain in the data directories. There is
no automatic updater.

### Publishing a release

Push a version tag on the desired commit, for example `localcode-v0.1.0-alpha.2`.
The LocalCode binaries workflow embeds that version, builds all six targets,
and publishes a GitHub Release with all six archives and six SHA-256 files
only after every build passes. Versions with a hyphen are marked prereleases.
Ordinary branch pushes produce Actions artifacts without publishing a release.

## First launch and configuration

Installing only copies the executable. First launch creates runtime directories,
logs, session storage and UI state as needed. **It does not generate a
`localcode.json` model configuration.** LocalCode can discover local Ollama
models without one; select a model in the TUI.

To set explicit limits, create `~/.config/localcode/localcode.json` (or use
`$XDG_CONFIG_HOME/localcode/localcode.json` if you override XDG paths):

On Windows, use the directory printed by `localcode debug paths config` and
create `localcode.json` there. Create the directory first if it does not exist.

```json
{
  "model": { "providerID": "ollama", "model": "qwen3.8-pi:27b", "variant": "none" },
  "providers": {
    "ollama": {
      "models": {
        "qwen3.8-pi:27b": { "limit": { "context": 163840, "output": 4096 } }
      }
    }
  },
  "compaction": { "auto": true, "buffer": 15000 },
  "experimental": { "todo": true }
}
```

Use your exact installed model tag and match `context` to Ollama's actual
`num_ctx`, not the model's advertised maximum. This example starts compaction
around 148,840 tokens. Configuring LocalCode's limit does not resize Ollama's
loaded context window. Restart LocalCode after editing the config.

The optional `experimental.todo` setting enables the bundled `todowrite` tool,
which is otherwise disabled by default.

For Ollama KV-cache memory settings on macOS, use `OLLAMA_KV_CACHE_TYPE=q8_0`
and `OLLAMA_FLASH_ATTENTION=1`. For terminal-started servers, export both in
`~/.zshrc`. For the Ollama app, set them with `launchctl setenv` and restart
Ollama; restore those values at login with a user LaunchAgent to survive
reboots. These are server-wide settings, not LocalCode config fields.
`q8_0` uses roughly half the KV-cache memory of `f16`; model weights and other
buffers are additional. `q4_0` reduces the cache further but may reduce quality.
Check the running backend to confirm the setting was applied; support depends
on the model/backend. Changing a terminal variable does not reconfigure a
server that is already running.

For Ollama models advertising thinking controls, use the TUI's **Switch model variant**
command to select a supported level. `none` disables thinking; `low` reduces it
where the model supports levels. The default variant leaves the server default
in effect. Models may support on/off only, or require thinking; available
choices follow their metadata. Hiding thinking text in the UI does not disable
generation. The example above selects `none` for new sessions; existing sessions
can retain their saved selection.

If your shell sets `XDG_CONFIG_HOME` to a read-only managed/Nix location, launch
with `XDG_CONFIG_HOME="$HOME/.config" localcode`, or wrap that command in a
launcher. LocalCode stores its files in the `localcode` subdirectory.

Resume a session with `localcode -s <session-id>` or the latest with
`localcode --continue`. Sessions/config are separate from installed OpenCode.

## Upstream reference

The upstream documentation below is retained for attribution and reference.
**Its installation commands install OpenCode, not LocalCode.**

---

<p align="center">
  <a href="https://opencode.ai">
    <picture>
      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="OpenCode logo">
    </picture>
  </a>
</p>
<p align="center">The open source AI coding agent.</p>
<p align="center">
  <a href="https://opencode.ai/discord"><img alt="Discord" src="https://img.shields.io/discord/1391832426048651334?style=flat-square&label=discord" /></a>
  <a href="https://www.npmjs.com/package/@opencode/cli"><img alt="npm" src="https://img.shields.io/npm/v/@opencode/cli?style=flat-square" /></a>
  <a href="https://github.com/anomalyco/opencode/actions/workflows/release.yml"><img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/anomalyco/opencode/release.yml?style=flat-square&branch=dev" /></a>
</p>

<p align="center">
  <a href="README.md">English</a> |
  <a href="README.zh.md">简体中文</a> |
  <a href="README.zht.md">繁體中文</a> |
  <a href="README.ko.md">한국어</a> |
  <a href="README.de.md">Deutsch</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.it.md">Italiano</a> |
  <a href="README.da.md">Dansk</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.pl.md">Polski</a> |
  <a href="README.ru.md">Русский</a> |
  <a href="README.bs.md">Bosanski</a> |
  <a href="README.ar.md">العربية</a> |
  <a href="README.no.md">Norsk</a> |
  <a href="README.br.md">Português (Brasil)</a> |
  <a href="README.th.md">ไทย</a> |
  <a href="README.tr.md">Türkçe</a> |
  <a href="README.uk.md">Українська</a> |
  <a href="README.bn.md">বাংলা</a> |
  <a href="README.gr.md">Ελληνικά</a> |
  <a href="README.vi.md">Tiếng Việt</a>
</p>

[![OpenCode Terminal UI](packages/web/src/assets/lander/screenshot.png)](https://opencode.ai)

---

### Installation

```bash
# YOLO
curl -fsSL https://opencode.ai/v2/install | bash

# Package managers
npm i -g @opencode/cli@latest      # or bun/pnpm/yarn
brew install anomalyco/tap/opencode-v2 # macOS and Linux (recommended, always up to date)
brew install opencode              # macOS and Linux (official brew formula, updated less)
sudo pacman -S opencode            # Arch Linux (Stable)
paru -S opencode-beta              # Arch Linux (Latest from AUR)
mise use -g opencode               # Any OS
nix run github:anomalyco/opencode  # Nix
```

> [!TIP]
> Remove versions older than 0.1.x before installing.

### Desktop App (BETA)

OpenCode is also available as a desktop application. Download it from [opencode.ai/download](https://opencode.ai/download).

| Platform              | Download                         |
| --------------------- | -------------------------------- |
| macOS (Apple Silicon) | `opencode-desktop-mac-arm64.dmg` |
| macOS (Intel)         | `opencode-desktop-mac-x64.dmg`   |
| Windows               | `opencode-desktop-win-x64.exe`   |
| Linux                 | `.deb`, `.rpm`, or `.AppImage`   |

```bash
# macOS (Homebrew)
brew install --cask opencode-desktop
```

#### Installation Directory

The install script installs OpenCode to `$HOME/.opencode/bin`.

### Agents

OpenCode includes two built-in agents you can switch between with the `Tab` key.

- **build** - Default, full-access agent for development work
- **plan** - Read-only agent for analysis and code exploration
  - Denies file edits by default
  - Asks permission before running bash commands
  - Ideal for exploring unfamiliar codebases or planning changes

Also included is a **general** subagent for complex searches and multistep tasks.
This is used internally and can be invoked using `@general` in messages.

Learn more about [agents](https://opencode.ai/v2/docs/agents).

### Documentation

For more info on how to configure OpenCode, [**head over to our docs**](https://opencode.ai/v2/docs).

### Contributing

If you're interested in contributing to OpenCode, please read our [contributing docs](./CONTRIBUTING.md) before submitting a pull request.

### Building on OpenCode

If you are working on a project that's related to OpenCode and is using "opencode" as part of its name, for example "opencode-dashboard" or "opencode-mobile", please add a note to your README to clarify that it is not built by the OpenCode team and is not affiliated with us in any way.

---

**Join our community** [Discord](https://discord.gg/opencode) | [X.com](https://x.com/opencode)
