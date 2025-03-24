import { ArgsOf, bindCommand, Command } from "../utils/command";
import { option, withStage } from "../utils/stage";
import { commandExec } from "../utils/exec";
import { adaAuth } from "../actions/adaAuth";

@bindCommand("Create Cognito User")
export class CreateCognitoUser extends Command {
  builder() {
    return withStage({
      password: option({
        alias: "p",
        description: "User password, default is Password123*",
      }),
      userpool: option({
        alias: "u",
        description: "User Pool Id, default is taken from accounts user pools",
      }),
    });
  }

  async handler(args: ArgsOf<this>): Promise<void> {
    const { password = "Password123*", userpool } = args;
    const username = this.argAt(1, "Usage jst create-cognito-user [username]");
    await adaAuth();

    const userPoolId = userpool || (await this.getUserPoolId(args));

    console.info("Got user pool:", userPoolId);

    await commandExec(
      `aws cognito-idp admin-create-user --user-pool-id ${userPoolId} --username ${username}`,
    );

    await commandExec(
      `aws cognito-idp admin-set-user-password --user-pool-id ${userPoolId} --username ${username} --password ${password} --permanent`,
    );
  }

  async getUserPoolId(args: ArgsOf<this>) {
    const poolsString = await commandExec(
      `aws cognito-idp list-user-pools --max-results=10`,
      { quiet: true },
    );
    const pools = JSON.parse(poolsString.join(""));
    switch (pools.UserPools.length || 0) {
      case 0:
        throw new Error("Failed to get Cognito user pools");
      case 1:
        return pools.UserPools[0].Id;
      default:
        const filteredPools = pools.UserPools.filter(
          (pool: Record<string, string>) => pool.Name.includes(args.stage),
        );
        if (filteredPools.length !== 1)
          throw new Error("Failed to get Cognito user pools");
        return filteredPools[0].Id;
    }
  }
}
