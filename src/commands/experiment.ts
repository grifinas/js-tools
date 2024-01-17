import { ArgsOf, bindCommand, Command } from "../utils/command";
import { withStage } from "../utils/stage";
import { commandExec } from "../utils/exec";

@bindCommand("experiment")
export class Experiment extends Command {
  builder() {
    return withStage({});
  }

  async handler(args: ArgsOf<this>) {
    await commandExec(`kinit`);
  }
}
