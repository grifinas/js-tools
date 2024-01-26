import { ArgsOf, bindCommand, Command } from "../utils/command";
import { option, withStage } from "../utils/stage";
import { commandExec } from "../utils/exec";
import { adaAuth } from "../actions/adaAuth";

@bindCommand("dev-deploy [stack] deploys specified stack to AWS")
export class DevDeploy extends Command {
  builder() {
    return withStage({
      inclusive: option({
        boolean: true,
        alias: "i",
        default: false,
        describe:
          "whether to include stack dependencies into the deployment process",
      }),
      build: option({
        boolean: true,
        alias: "b",
        default: false,
        describe: "whether to build the application before deploying or not",
      }),
    });
  }

  async handler(args: ArgsOf<this>) {
    const stack = this.argAt(1, "Usage: jst dev-deploy [stack]");

    await adaAuth();
    if (args.build) {
      await commandExec(`brazil-build`);
    }
    await commandExec(
      `cdk deploy "${stack}" --require-approval never ${
        args.inclusive ? "" : "--exclusively"
      }`,
    );
  }
}
