import { ArgsOf, bindCommand, Command } from "../utils/command";
import { getStage, option, withStage } from "../utils/stage";
import { commandExec } from "../utils/exec";
import { adaAuth } from "../actions/adaAuth";
import { lexStackName } from "../actions/lexStackName";
import { tokenize } from "../actions/tokenize";
import { listStacks, ListStacksError } from "../actions/listStacks";

@bindCommand("dev-deploy [stack] deploys specified stack to AWS")
export class DevDeploy extends Command {
  builder() {
    return withStage({
      inclusive: option({
        boolean: true,
        alias: "i",
        default: false,
        describe:
          "If passed will include stack dependencies into the deployment process",
      }),
      quiet: option({
        boolean: true,
        alias: "q",
        default: false,
        describe: "If passed, no sound is played when finished",
      }),
      build: option({
        boolean: true,
        alias: "b",
        default: false,
        describe: "If passed, will run brazil-build before deploying",
      }),
      parse: option({
        boolean: true,
        alias: "p",
        default: true,
        describe:
          "If disabled, will treat stack name as literal as opposed to parsing it, spreading brackets and applying wildcards",
      }),
      skipNameCheck: option({
        boolean: true,
        default: false,
        describe:
          "If passed, does not check against JSON files to see if the stack name exists",
      }),
    });
  }

  async handler(args: ArgsOf<this>) {
    this.playSound = !args.quiet;

    const stacks = await this.parseStacks(args);

    if (!stacks.length) {
      console.error("No stacks found, exiting");
      return 1;
    }

    console.log("Will deploy stacks:", stacks);

    await adaAuth();
    if (args.build) {
      await commandExec(`brazil-build`);
    }

    for (const stack of stacks) {
      await commandExec(
        `cdk deploy ${stack} --require-approval never ${
          args.inclusive ? "" : "--exclusively"
        }`,
      );
    }
  }

  async parseStacks(args: ArgsOf<this>): Promise<string[]> {
    const stack = this.argAt<string>(1, "Usage: jst dev-deploy [stack]");

    let availableStacks: string[] = [];
    if (!args.skipNameCheck) {
      try {
        availableStacks = await listStacks();
      } catch (e) {
        if (e instanceof ListStacksError) {
          console.error(e.message);
          console.error("Reason:", e.prev);
          console.error(
            "You can try rerunning with -b command, if that does not work, --skipNameCheck will",
          );
          console.log(
            "Failed to list stacks, proceeding as if stack name is accurate",
          );
        }
        console.error(e);
        throw e;
      }
    }

    const stacks: string[] = [];
    if (args.parse) {
      stacks.push(
        ...lexStackName(tokenize(stack)).map((s) =>
          s.replace("[[STAGE]]", args.stage),
        ),
      );
    } else {
      stacks.push(stack);
    }

    console.log("parsed stacks:", stacks);

    if (!args.skipNameCheck) {
      for (const i in stacks) {
        stacks[i] = matchStackName(stacks[i], availableStacks);
      }
    }

    return stacks.filter(Boolean);
  }
}

function matchStackName(
  name: string,
  availableStacks: string[],
  iteration = 1,
): string {
  const lowercaseName = name.toLowerCase();
  let matching: string[] = [];
  switch (iteration) {
    case 1:
      matching = availableStacks.filter((s) =>
        s.toLowerCase().includes(lowercaseName),
      );
      break;
    case 2:
      matching = availableStacks.filter((s) => s.includes(getStage()));
      break;
  }

  switch (matching.length) {
    case 0:
      console.error(`No stack found matching: "${name}"`);
      return "";
    case 1:
      return matching[0];
    default:
      console.log("Matching stacks for", name, "--", matching);
      return matchStackName(name, matching, iteration + 1);
  }
}
