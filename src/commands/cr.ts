import { ArgsOf, bindCommand, Command } from "../utils/command";
import { option } from "../utils/stage";
import { getAwsPackageInfo } from "../actions/getAwsPackageInfo";
import { commandExec } from "../utils/exec";
import { listDir } from "../utils/fs/list-dir";
import path from "path";

@bindCommand("cr [lambda-name] creates cr from the current project")
export class Cr extends Command {
  builder() {
    return {
      update: option({
        string: true,
        default: "",
        alias: "u",
      }),
      offset: option({
        number: true,
        default: 1,
        alias: "o",
      }),
    };
  }

  async handler(args: ArgsOf<this>) {
    const directoryPath = await getAwsPackageInfo();
    const sourcesDir = path.join(directoryPath, "src");

    const [log] = await commandExec("git log -1 --pretty=%B", {
      noecho: true,
      quiet: true,
    });
    const include = [];

    const packages = await listDir(sourcesDir);
    for (let pkg of packages.filter((p) => !p.startsWith("."))) {
      const [rhs] = await commandExec(
        `cd ${path.join(sourcesDir, pkg)} && git log -1 --pretty=%B`,
        { noecho: true, quiet: true },
      );

      if (log === rhs) {
        include.push(pkg);
      }
    }

    const command = `cr -i ${include.join(",")} ${this.getReview(
      args,
    )} --parent HEAD^${args.offset}`;

    await commandExec(command);
  }

  getReview(args: ArgsOf<this>): string {
    const { update } = args;
    if (!update) {
      return "--new-review";
    }
    if (update.startsWith("http")) {
      const [cr] = update
        .substring(update.indexOf("code.amazon.com/reviews/") + 24)
        .split("/");
      return `-r ${cr}`;
    } else if (update.startsWith("CR")) {
      return `-r ${update}`;
    } else if (Number(update) > 0) {
      return `-r CR-${update}`;
    }

    throw new Error(`Failed to parse update arg: ${update}`);
  }
}
