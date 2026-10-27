import { Context, Effect, Layer } from "effect"
import { parse, type ParseError } from "jsonc-parser"
import type { Policy } from "./updater-action"

export const methods = ["curl", "npm", "pnpm", "bun", "yarn", "vp", "brew", "winget"] as const
export type Method = (typeof methods)[number]
export type RunResult = { readonly type: "available" | "installed"; readonly version: string }
export type CheckResult = RunResult | { readonly type: "unavailable"; readonly message: string }

export class UpgradeError extends Error {
  readonly title: string
  readonly detail: string
  readonly command?: string
  readonly retry: string

  constructor(
    input: { readonly title: string; readonly detail: string; readonly command?: string; readonly retry: string },
    options?: ErrorOptions,
  ) {
    super(input.detail, options)
    this.name = "UpgradeError"
    this.title = input.title
    this.detail = input.detail
    this.command = input.command
    this.retry = input.retry
  }
}

export interface Interface {
  readonly run: (onInstall?: (version: string) => void) => Effect.Effect<RunResult | undefined>
  readonly check: () => Effect.Effect<CheckResult | undefined, Error>
  readonly apply: (version: string) => Effect.Effect<void, Error>
  readonly method: () => Effect.Effect<Method | undefined>
  readonly latest: (method?: Method) => Effect.Effect<string, Error>
  readonly upgrade: (method: Method, version: string) => Effect.Effect<void, Error>
  readonly removal: (
    method: Method,
  ) => { readonly command: ReadonlyArray<string>; readonly run: Effect.Effect<void, Error> } | undefined
}

export class Service extends Context.Service<Service, Interface>()("@localcode/cli/Updater") {}

export function decodePolicy(text: string): Policy | undefined {
  const errors: ParseError[] = []
  const input: unknown = parse(text, errors, { allowTrailingComma: true })
  if (errors.length || typeof input !== "object" || input === null) return
  if ("update" in input) {
    const value = input.update
    if (value === "disable" || value === "notify" || value === "auto") return value
    return
  }
  if (!("autoupdate" in input)) return
  if (input.autoupdate === false) return "disable"
  if (input.autoupdate === "notify") return "notify"
  if (input.autoupdate === true) return "auto"
}

// Fork builds are installed by their owner; never inspect or replace an upstream installation.
export const layer = Layer.succeed(
  Service,
  Service.of({
    run: () => Effect.succeed(undefined),
    check: () => Effect.succeed({ type: "unavailable", message: "LocalCode updates are built from source." }),
    apply: () => Effect.fail(new Error("Build LocalCode from source to update it.")),
    method: () => Effect.succeed(undefined),
    latest: () => Effect.fail(new Error("LocalCode has no upstream update channel.")),
    upgrade: () => Effect.fail(new Error("Build LocalCode from source to update it.")),
    removal: () => undefined,
  }),
)

export * as Updater from "./updater"
export { action, type Action, type Policy } from "./updater-action"
