import { ArgsOf, bindCommand, Command } from "../utils/command";
import { getPartialTests } from "../actions/getPartialTests";
import { option } from "../utils/stage";
import * as path from "path";

@bindCommand("Gets tests to run of impacted dependencies in a typescript application")
export class GetPartialTests extends Command {
  builder() {
    return {
      path: option({
        string: true,
        alias: "p",
        default: "./",
        describe: "Path to TypeScript project",
      }),
      verbose: option({
        boolean: true,
        alias: "v",
        default: false,
        describe: "Print why each test was selected",
      }),
    };
  }

  async handler(args: ArgsOf<this>) {
    const projectPath = path.resolve(args.path);
    const verbose = String(args.verbose) === "true";
    const tests = await getPartialTests(projectPath, verbose);

    return tests.join(" ");
  }
}
