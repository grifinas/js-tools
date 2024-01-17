import { exec } from "child_process";
import chalk from "chalk";
import { ExecError } from "./errors";

interface CommandOptions {
  noecho: boolean;
}
export function commandExec(
  command: string,
  options: Partial<CommandOptions> = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    options.noecho || console.log(chalk.green(command));
    const process = exec(command);
    process.stdout?.on("data", (data) => {
      console.log(data);
    });
    process.stderr?.on("data", (data) => {
      console.error(data);
    });
    process.on("close", (code) => {
      if (code && code != 0) {
        reject(new ExecError(`Command returned non 0 code`, code));
      }
      resolve();
    });
    process.on("error", (err) => {
      console.log(chalk.bgRed(err.message));
      reject(err);
    });
  });
}
