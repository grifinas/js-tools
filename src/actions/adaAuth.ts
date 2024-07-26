import { getAwsAccount } from "./getAwsAccount";
import { InvalidAwsAccountError } from "../utils/errors";
import { commandExec } from "../utils/exec";

export async function adaAuth(account?: string): Promise<void> {
  if (!account) {
    return adaAuth(getAwsAccount());
  }

  if (!account.match(/[0-9]{12}/)) {
    throw new InvalidAwsAccountError(
      `account number: "${account}" does not match expected format of 12 numbers. E.g. 955051460414`,
    );
  }

  await commandExec(
    `ada credentials update --account=${account} --provider=conduit --role=IibsAdminAccess-DO-NOT-DELETE --once`,
  );
}
