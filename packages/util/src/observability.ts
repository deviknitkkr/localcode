export * as Observability from "./observability.js"

import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem"
import { LayerNode } from "./effect/layer-node.js"
import { Layer, Logger, References, Schema } from "effect"
import { Logging } from "./observability/logging.js"

export const Options = Schema.Struct({
  endpoint: Schema.optional(Schema.String),
  headers: Schema.optional(Schema.String),
  client: Schema.optional(Schema.String),
  version: Schema.optional(Schema.String),
  channel: Schema.optional(Schema.String),
})
export type Options = typeof Options.Type

export function layer(options: Options = {}) {
  const app = {
    client: options.client ?? "opencode",
    version: options.version ?? "unknown",
    channel: options.channel ?? "local",
  }
  return Logger.layer(Logging.loggers(app.channel === "local", app.channel), { mergeWithExisting: false }).pipe(
    Layer.provide(NodeFileSystem.layer),
    Layer.orDie,
    Layer.merge(Layer.succeed(References.MinimumLogLevel, Logging.minimumLogLevel())),
  )
}

// Layer.suspend: constructing the loggers eagerly at module scope performs
// I/O (file logger, run id) that workerd forbids in global scope.
export const node = LayerNode.make({
  name: "observability",
  layer: Layer.suspend(() => layer()),
  deps: [],
})
