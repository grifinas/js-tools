import chalk from "chalk";
import { getVerbosity } from "./verbosity";

export function cliInfo(...args: unknown[]): void {
  if (!["info", "debug"].includes(getVerbosity())) return;
  console.log(chalk.cyan(...args));
}

export function cliDebug(...args: unknown[]): void {
  if (getVerbosity() !== "debug") return;
  console.log(chalk.gray(...args));
}

export function cliWarn(...args: unknown[]): void {
  if (!["info", "debug"].includes(getVerbosity())) return;
  console.log(chalk.rgb(175, 125, 0)(...args));
}
export function cliError(...args: unknown[]): void {
  if (!["error", "info", "debug"].includes(getVerbosity())) return;
  console.error(chalk.red(...args));
}
