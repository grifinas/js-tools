import { exec } from "child_process";
import chalk from "chalk";
import { ExecError } from "./errors";

interface CommandOptions {
  noecho: boolean;
  quiet: boolean;
}
export function commandExec(
  command: string,
  options: Partial<CommandOptions> = {},
): Promise<string[]> {
  const results: string[] = [];
  return new Promise((resolve, reject) => {
    options.noecho || console.log(chalk.green(command));
    const process = exec(command);
    process.stdout?.on("data", (data) => {
      results.push(data);
      options.quiet || console.log(data);
    });
    process.stderr?.on("data", (data) => {
      options.quiet || console.error(data);
    });
    process.on("close", (code) => {
      if (code && code != 0) {
        reject(new ExecError(`Command returned non 0 code`, code));
      }
      resolve(results);
    });
    process.on("error", (err) => {
      options.quiet || console.log(chalk.bgRed(err.message));
      reject(err);
    });
  });
}
