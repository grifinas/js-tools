import { ArgsOf, bindCommand, Command } from "../utils/command";
import { adaAuth } from "../actions/adaAuth";
import { Options } from "yargs";
import { getAwsAccount } from "../actions/getAwsAccount";
import { withStage } from "../utils/stage";

@bindCommand("ADA auth")
export class AdaAuth extends Command {
  builder() {
    return withStage({
      account: {
        string: true,
        alias: "a",
      } as Options,
    });
  }

  async handler(args: ArgsOf<this>): Promise<void> {
    const account = args.account || getAwsAccount();

    await adaAuth(account);
  }
}
