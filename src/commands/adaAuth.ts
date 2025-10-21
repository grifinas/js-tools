import { ArgsOf, bindCommand, Command } from "../utils/command";
import { adaAuth } from "../actions/adaAuth";
import { getAwsAccount } from "../actions/getAwsAccount";
import { option, withStage } from "../utils/stage";

@bindCommand("ADA auth")
export class AdaAuth extends Command {
  builder() {
    return withStage({
      account: option({
        string: true,
        alias: "a",
        description:
          "Account ID to auth as, by default gets the account from accounts.json file",
      }),
      force: option({
        boolean: true,
        alias: "f",
        description: "Force authentication without checking cache",
        default: false,
      }),
    });
  }

  async handler(args: ArgsOf<this>): Promise<void> {
    const account = args.account || getAwsAccount();

    await adaAuth(account, {
      force: Boolean(args.force),
    });
  }
}
