import { Config } from "effect"

// Every environment variable the CLI reads, in one place. Consumers yield
// these instead of touching process.env so the full surface stays visible,
// typed, and redacted where secret.

// LocalCode's own server password, including private child-server credentials.
export const password = Config.Redacted("LOCALCODE_PASSWORD").pipe(Config.withDefault(undefined))

export function session() {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] =>
        entry[1] !== undefined && !entry[0].startsWith("OPENCODE_") && entry[0] !== "LOCALCODE_PASSWORD",
    ),
  )
}

export * as Env from "./env"
