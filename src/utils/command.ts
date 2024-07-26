import { toKebabCase } from "./string/to-kebab-case";
import yargs, { ArgumentsCamelCase, Options } from "yargs";
import { Newable } from "./newable";
import { setStage, stageOption } from "./stage";
import { MissingRequiredPositionalArg } from "./errors";

export type ArgsOf<T extends Command> = ArgumentsCamelCase<
  Record<keyof ReturnType<T["builder"]>, string>
>;
export type Result = void | string | number;
export abstract class Command {
  private args: ArgumentsCamelCase | null = null;
  get name() {
    return toKebabCase(this.constructor.name);
  }

  builder(): Record<string, Options> {
    return {};
  }

  async realHandler(args: ArgumentsCamelCase): Promise<void> {
    this.args = args;
    if (this.builder()["stage"] === stageOption) {
      //@ts-ignore
      setStage(args.stage || "beta");
    }
    try {
      const result = await this.handler(args);
      if (typeof result === "string") {
        console.log(result);
        return;
      } else if (typeof result === "number" && result > 0) {
        yargs.exit(result, new Error("Unknown error"));
        return;
      } else {
        return;
      }
    } catch (e) {
      if (e instanceof MissingRequiredPositionalArg) {
        console.log(e.message);
        return;
      }
      const error = e instanceof Error ? e : new Error("Unknown error");
      console.log(error);
      yargs.exit(1, error);
    }
  }

  argAt<T>(position: number, message: string): T {
    const arg = this.args?._[position];
    if (!arg) {
      throw new MissingRequiredPositionalArg(message);
    }

    return arg as T;
  }

  abstract handler(args: ArgumentsCamelCase): Promise<Result>;
}

export function bindCommand(describe: string) {
  return function (commandConstructor: Newable<Command>) {
    const command = new commandConstructor();

    yargs.command({
      command: command.name,
      describe,
      handler: command.realHandler.bind(command),
      builder: command.builder(),
    });
  };
}
