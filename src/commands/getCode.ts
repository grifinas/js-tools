import { ArgsOf, bindCommand, Command } from "../utils/command";
import { option, withStage } from "../utils/stage";
import { adaAuth } from "../actions/adaAuth";
import { getCode } from "../actions/getCode";

@bindCommand("get-code [functionName]")
export class GetCode extends Command {
  builder() {
    return withStage({
      quiet: option({
        boolean: true,
        alias: "q",
        default: false,
        describe: "If passed, no sound is played when finished",
      }),
    });
  }

  async handler(args: ArgsOf<this>) {
    this.playSound = !args.quiet;

    const functionName = this.argAt<string>(
      1,
      "Usage: jst get-code [functionName]",
    );
    await adaAuth();

    await getCode(functionName);

    console.log("Done");
  }
}
