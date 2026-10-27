export * as RemoteTunnel from "./remote-tunnel"

import { Effect } from "effect"

// Remote MCP is independent of exposing LocalCode itself through a hosted tunnel.
export const run = Effect.fnUntraced(function* (_input: {
  readonly route: string
  readonly target: string
  readonly onURL: (url: string | undefined) => void
}) {
  return yield* Effect.fail(new Error("Hosted tunnels are not supported by LocalCode."))
})

export const ensure = Effect.fnUntraced(function* () {
  return yield* Effect.fail(new Error("Hosted tunnels are not supported by LocalCode."))
})

export const hostname = (_route: string) => Effect.succeed<string | undefined>(undefined)
