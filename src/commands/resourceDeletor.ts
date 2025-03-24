import { ArgsOf, bindCommand, Command } from "../utils/command";
import { adaAuth } from "../actions/adaAuth";
import { Options } from "yargs";
import { getAwsAccount } from "../actions/getAwsAccount";
import { option, withStage } from "../utils/stage";
import { commandExec } from "../utils/exec";

interface StackTemplate {
  TemplateBody: {
    Resources: Record<
      string,
      {
        Type: string;
        Properties: Record<string, any>;
      }
    >;
  };
}

@bindCommand("Resource Deletor")
export class ResourceDeletor extends Command {
  builder() {
    return withStage({});
  }

  async handler(args: ArgsOf<this>): Promise<void> {
    const stack = this.argAt<string>(1, "Usage jst who-owns [stack]");
    await adaAuth();

    const stackTemplate = (
      await commandExec(
        `aws cloudformation get-template --stack-name=${stack}`,
        { quiet: true },
      )
    ).join("");

    const {
      TemplateBody: { Resources },
    } = JSON.parse(stackTemplate) as StackTemplate;

    console.log(
      "Resources",
      Object.entries(Resources).map(([k, v]) => `${k} -- ${v.Type}`),
    );

    const alarms = (
      await commandExec("aws cloudwatch describe-alarms", { quiet: true })
    ).join("");

    console.log("alarms", alarms);
    // for (const stack of stacks.Stacks) {
    //   sta;
    //   if (stackTemplate.includes(resource)) {
    //     console.log(stack.StackName, "includes", resource);
    //     if (!args.all) {
    //       return;
    //     }
    //   }
    // }
  }
}
