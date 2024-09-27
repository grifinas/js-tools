import * as yargs from "yargs";

export function cliAssert(value: unknown, message?: string): asserts value {
  if (value) return;

  console.error(message);
  yargs.exit(1, new Error());
}
