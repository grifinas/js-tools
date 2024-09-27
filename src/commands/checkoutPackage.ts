import { ArgsOf, bindCommand, Command } from "../utils/command";
import { readAwsPackageInfo } from "../actions/readAwsPackageInfo";
import { commandExec } from "../utils/exec";
import { option } from "../utils/stage";

@bindCommand(
  "checkout-package [package-name] checks out package belonging to the version set in the current dir",
)
export class CheckoutPackage extends Command {
  builder() {
    return {
      packageValidation: option({
        boolean: true,
        alias: "p",
        default: true,
        describe: "whether to validate package name with the packageInfo file",
      }),
    };
  }

  async handler(args: ArgsOf<this>) {
    const packageName = this.argAt(
      1,
      "Usage: jst checkout-package [package-name]",
    );

    const info = await readAwsPackageInfo();
    const base = info.base as Record<string, string | undefined> | undefined;
    const versionSet = base?.versionSet;
    if (!versionSet) {
      throw new Error("Unable to find versionSet");
    }

    if (args.packageValidation) {
      const packages = info.packages as
        | Record<string, string | undefined>
        | undefined;
      if (!packages) {
        throw new Error("Unable to find packages list in packageInfo");
      }
      const foundPackage = Object.keys(packages).find(
        (p) => p && p.match(new RegExp(`^${packageName}.*`)),
      );
      if (!foundPackage) {
        throw new Error(
          `Unable to find package in packageInfo packages list, looked for: ${packageName}`,
        );
      }
    }

    await commandExec(
      `brazil ws use --versionset ${versionSet} --package ${packageName}`,
    );
  }
}
