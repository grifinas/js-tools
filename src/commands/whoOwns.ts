import { ArgsOf, bindCommand, Command } from "../utils/command";
import { adaAuth } from "../actions/adaAuth";
import { option, withStage } from "../utils/stage";
import { commandExec } from "../utils/exec";

@bindCommand("Who owns")
export class WhoOwns extends Command {
  builder() {
    return withStage({
      all: option({
        boolean: true,
        default: false,
        alias: "a",
        description: "If passed, will find all instances of resource",
      }),
      region: option({
        string: true,
        default: "us-east-1",
        alias: "r",
        description: "Region to check",
      }),
    });
  }

  async handler(args: ArgsOf<this>): Promise<void> {
    const resource = this.argAt<string>(1, "Usage jst who-owns [resource]");
    await adaAuth();
    const res = await commandExec(
      `aws cloudformation describe-stacks --region=${args.region}`,
      {
        quiet: true,
      },
    );
    const stacks = JSON.parse(res.join(""));

    for (const stack of stacks.Stacks) {
      const stackTemplate = (
        await commandExec(
          `aws cloudformation get-template --stack-name=${stack.StackName} --region=${args.region}`,
          { quiet: true },
        )
      ).join("");
      if (stackTemplate.includes(resource)) {
        console.log(stack.StackName, "includes", resource);
        if (!args.all) {
          return;
        }
      }
    }
  }
}
