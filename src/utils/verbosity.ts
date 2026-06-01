import { Options } from "yargs";
import { option } from "./stage";

export type Verbosity = "none" | "error" | "info" | "debug";

let verbosity: Verbosity = "none";

export const verbosityOption = option({
  choices: ["none", "error", "info", "debug"],
  type: "string",
  default: "info",
  describe: "Verbosity level",
  alias: 'v'
});

export function setVerbosity(value: Verbosity) {
  verbosity = value;
}

export function getVerbosity(): Verbosity {
  return verbosity;
}

export function withVerbosity<T extends Record<string, Options>>(
  options: T,
): T & { verbosity: typeof verbosityOption } {
  return {
    ...options,
    verbosity: verbosityOption,
  };
}
