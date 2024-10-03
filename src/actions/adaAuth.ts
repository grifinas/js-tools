import { getAwsAccount } from "./getAwsAccount";
import { InvalidAwsAccountError } from "../utils/errors";
import { commandExec } from "../utils/exec";
import { FsCache } from "../services/fsCache";
import { minutesFromNow } from "../utils/date";

interface AdaAuthCache {
  account: string;
  iat: number;
}

export async function adaAuth(account?: string): Promise<void> {
  account = account || getAwsAccount();
  if (await isAlreadyAuthenticated(account)) {
    console.log("Already authenticated");
    return;
  }

  if (!account.match(/[0-9]{12}/)) {
    throw new InvalidAwsAccountError(
      `account number: "${account}" does not match expected format of 12 numbers. E.g. 955051460414`,
    );
  }

  await commandExec(
    `ada credentials update --account=${account} --provider=conduit --role=IibsAdminAccess-DO-NOT-DELETE --once`,
  );

  const cache = await FsCache.instance();
  cache.set("adaauth", {
    account,
    iat: new Date().getTime(),
  } as AdaAuthCache);
}

async function isAlreadyAuthenticated(account: string): Promise<boolean> {
  const cache = await FsCache.instance();
  const ada = cache.get<AdaAuthCache>("adaauth");

  return Boolean(
    ada && ada.account === account && ada.iat > minutesFromNow(-5).getTime(),
  );
}
