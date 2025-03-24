import { toKebabCase } from "./string/to-kebab-case";
import yargs, { ArgumentsCamelCase, Options } from "yargs";
import { Newable } from "./newable";
import { setStage, stageOption } from "./stage";
import { MissingRequiredPositionalArg } from "./errors";
import { FsCache } from "../services/fsCache";
import { failSound, successSound } from "../actions/playSound";
import { defer, settleDefferedPromises } from "./defer";

export type ArgsOf<T extends Command> = ArgumentsCamelCase<
  Record<keyof ReturnType<T["builder"]>, string>
>;
export type Result = void | string | number;
export abstract class Command {
  protected playSound: boolean = false;
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

    let responseCode: number = 0;
    let error: Error | undefined;
    try {
      const result = await this.handler(args);
      await FsCache.save();
      if (typeof result === "string") {
        this.playSound && defer(successSound());
        console.log(result);
      } else if (typeof result === "number" && result > 0) {
        this.playSound && defer(failSound());
        responseCode = result;
        error = new Error("Unknown error");
      } else {
        this.playSound && defer(successSound());
      }
    } catch (e) {
      this.playSound && defer(failSound());
      if (e instanceof MissingRequiredPositionalArg) {
        console.error(e.message);
      } else {
        error = e instanceof Error ? e : new Error("Unknown error");
        responseCode = 1;
      }
    } finally {
      await settleDefferedPromises();
    }

    if (responseCode !== 0 && error) {
      console.error(error);
      yargs.exit(responseCode, error);
    } else {
      return;
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
