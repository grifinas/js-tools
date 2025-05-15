import { Options } from "yargs";
import { InvalidStageError } from "./errors";

export const stageOption = {
  choices: ["beta", "gamma", "prod"],
  type: "string",
  alias: "s",
  default: "beta",
  describe: "what staging account to ada-auth into (default is beta)",
} as const;

export const noErrorOption = option({
  boolean: true,
  default: false,
  describe: "Whether to print errors to console",
});

export function setStage(stage: string) {
  const loweredStage = stage.toLowerCase();
  //@ts-ignore
  if (stageOption.choices.includes(loweredStage)) {
    process.env["stage"] = stage;
    return;
  }

  throw new InvalidStageError(
    `Invalid stage supplied: ${stage}, allowed options: ${JSON.stringify(stageOption.choices)}`,
  );
}

export function getStage(): string {
  return process.env["stage"] || "beta";
}

export function withStage<T extends Record<string, Options>>(
  options: T,
): T & { stage: typeof stageOption } {
  return {
    ...options,
    stage: stageOption,
  };
}

//Just for type-hinting
export function option<T extends Options>(obj: T): T {
  return obj;
}
