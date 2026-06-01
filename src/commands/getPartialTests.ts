import { ArgsOf, bindCommand, Command } from "../utils/command";
import { getPartialTests } from "../actions/getPartialTests";
import { option } from "../utils/stage";
import { withVerbosity } from "../utils/verbosity";
import * as path from "path";
import { spawnCommand } from '../utils/exec';

const DEFAULT_TEST_EXTENSIONS = [".spec.", ".test.", ".it.", ".e2e."];
const PARTIAL_TESTS_REPORTER_PATH = path.resolve(__dirname, "../reporters/partial-tests.js");

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
        default: DEFAULT_TEST_EXTENSIONS,
        describe: "Test filename infixes to match, e.g. .spec. .test.",
      }),
      mirror: option({
        boolean: true,
        alias: "m",
        default: true,
        describe: "Use mirrored paths in /test/ dir when finding tests",
      }),
      run: option({
        boolean: true,
        alias: "r",
        default: false,
        describe: "Actually run the tests",
      }),
    });
  }

  async handler(args: ArgsOf<this>) {
    const projectPath = path.resolve(args.path);
    const testExtensions = normalizeTestExtensions(args.testExtensions);
    const tests = await getPartialTests(projectPath, { testExtensions, mirror: Boolean(args.mirror) });

    if (args.run) {
      spawnCommand(`node`, [`${projectPath}/node_modules/jest/bin/jest.js`, '--runInBand', `--reporters=${PARTIAL_TESTS_REPORTER_PATH}`, `--runTestsByPath`, ...tests]);
    } else {
      return tests.join(" ");
    }
  }
}

function normalizeTestExtensions(value: string | string[]): string[] {
  return [value]
    .flat()
    .flatMap((item) => item.split(","))
    .map((item) => {
      const trimmed = item.trim();
      const start = trimmed.startsWith('.');
      const end = trimmed.endsWith('.');
      return `${start ? '' : '.'}${trimmed}${end ? '' : '.'}`;
    })
    .filter(Boolean);
}
