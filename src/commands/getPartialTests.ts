import { ArgsOf, bindCommand, Command } from "../utils/command";
import { getPartialTests } from "../actions/getPartialTests";
import { option } from "../utils/stage";
import { withVerbosity } from "../utils/verbosity";
import * as path from "path";

@bindCommand("Gets tests to run of impacted dependencies in a typescript application")
export class GetPartialTests extends Command {
  builder() {
    return withVerbosity({
      path: option({
        string: true,
        alias: "p",
        default: "./",
        describe: "Path to TypeScript project",
      }),
      testExtensions: option({
        string: true,
        alias: "t",
        array: true,
        default: [],
        describe: "Test filename infixes to match, e.g. .spec. .test.",
      }),
    });
  }

  async handler(args: ArgsOf<this>) {
    const projectPath = path.resolve(args.path);
    const testExtensions = normalizeTestExtensions(args.testExtensions);
    const tests = await getPartialTests(projectPath, testExtensions);

    return tests.join(" ");
  }
}

function normalizeTestExtensions(value: string | string[]): string[] {
  return [value]
    .flat()
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}
