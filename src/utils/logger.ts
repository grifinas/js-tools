import chalk from "chalk";

export function cliInfo(...args: unknown[]): void {
  console.log(chalk.green(...args));
}

export function cliWarn(...args: unknown[]): void {
  console.log(chalk.rgb(175, 125, 0)(...args));
}
export function cliError(...args: unknown[]): void {
  console.error(chalk.red(...args));
}
