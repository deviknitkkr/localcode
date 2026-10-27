import { Service, type Endpoint, type EnsureOptions } from "@opencode/client/effect/service"
import { ClientError, isUnauthorizedError, OpenCode } from "@opencode/client/promise"
import { OPENCODE_VERSION } from "../version"
import { Effect, Option, Redacted } from "effect"
import { Server as ServerFlag, Standalone as StandaloneFlag } from "../commands/commands"
import { Env } from "../env"
import { Standalone } from "./standalone"
import { errorMessage } from "../util/error"

export type Args = {
  readonly server?: string
  readonly standalone?: boolean
  readonly mismatch?: "replace" | "ignore" | "error"
  readonly onStart?: EnsureOptions["onStart"]
}

export type Resolved = {
  readonly endpoint: Endpoint
  readonly service?: {
    readonly reconnect: () => ReturnType<typeof Service.ensure>
    readonly restart: () => ReturnType<typeof Service.ensure>
  }
}

export const resolve = Effect.fn("cli.server-connection.resolve")(function* (args: Args = {}) {
  const serverFlag = yield* Effect.serviceOption(ServerFlag).pipe(Effect.map(Option.flatten))
  const standaloneFlag = yield* Effect.serviceOption(StandaloneFlag)
  const server = args.server ?? Option.getOrUndefined(serverFlag)
  const standalone = args.standalone ?? Option.getOrElse(standaloneFlag, () => false)
  if (server !== undefined && standalone)
    return yield* Effect.fail(new Error("--server and --standalone cannot be combined"))
  if (server !== undefined) {
    const password = yield* Env.password
    const endpoint = {
      url: server,
      auth: password ? { type: "basic" as const, username: "opencode", password: Redacted.value(password) } : undefined,
    } satisfies Endpoint
    const client = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) })
    const health = yield* Effect.tryPromise({
      try: () => client.server.info({ signal: AbortSignal.timeout(5_000) }),
      catch: (cause) => connectError(endpoint, cause),
    })
    if (health.version !== OPENCODE_VERSION)
      process.stderr.write(
        `Warning: Server at ${endpoint.url} has version ${health.version}; this client is ${OPENCODE_VERSION}. Continuing anyway.\n`,
      )
    return { endpoint } satisfies Resolved
  }
  return { endpoint: yield* Standalone.start() } satisfies Resolved
})

export const shutdownPersistentPty = Effect.fn("cli.server-connection.shutdown-persistent-pty")(function* (
  options: EnsureOptions,
) {
  const endpoint = yield* Service.discover({ ...options, version: undefined })
  if (!endpoint) return
  const client = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) })
  yield* Effect.tryPromise(() => client.experimental.persistentPty.shutdown())
})

function connectError(endpoint: Endpoint, cause: unknown) {
  if (isUnauthorizedError(cause)) {
    return new Error(
      endpoint.auth === undefined
        ? `Server at ${endpoint.url} requires a password; set LOCALCODE_PASSWORD`
        : `Server at ${endpoint.url} rejected the password`,
      { cause },
    )
  }
  if (cause instanceof ClientError && cause.reason === "Transport")
    return new Error(`Could not reach server at ${endpoint.url}: ${errorMessage(cause.cause ?? cause)}`, { cause })
  return new Error(
    `Server at ${endpoint.url} did not provide a compatible V2 health response: ${errorMessage(cause)}`,
    { cause },
  )
}

export * as ServerConnection from "./server-connection"
