import { ArgsOf, bindCommand, Command } from "../utils/command";
import { getAwsArtifactDir } from "../actions/getAwsArtifactDir";
import fs, { rm } from "fs/promises";
import { option, withStage } from "../utils/stage";
import { commandExec } from "../utils/exec";
import { adaAuth } from "../actions/adaAuth";
import { getAwsLambdaTransform } from "../actions/getAwsLambdaTransform";
import { getLambdaNames } from "../actions/getLambdaNames";
import * as path from "path";
import { promptUser } from "../actions/prompt-user";
import { cliInfo, cliWarn } from "../utils/logger";
import {
  UpdateFunctionCodeCommand,
  ListFunctionsCommand,
  LambdaClient,
  ResourceNotFoundException,
} from "@aws-sdk/client-lambda";
import { inferOptionOrAsk } from "../actions/inferOptionOrAsk";
import { fromIni } from "@aws-sdk/credential-providers";

const Prune = {
  yes: "yes",
  no: "no",
  ask: "ask",
  always: "always",
} as const;
const PRUNE_OPTIONS = Object.values(Prune);

@bindCommand("update-code [lambda-name] updates the code of specified lambda")
export class UpdateCode extends Command {
  builder() {
    return withStage({
      build: option({
        choices: ["brazil", "npm", "none"],
        type: "string",
        alias: "b",
        default: "brazil",
        describe: "What command to use to build the application",
      }),
      dir: option({
        type: "string",
        alias: "z",
        describe:
          "If passed will not build anything. Instead just zip specified dir and send",
      }),
      quiet: option({
        boolean: true,
        alias: "q",
        default: false,
        describe: "If passed, no sound is played when finished",
      }),
      region: option({
        string: true,
        describe: "Region in which to run the update",
      }),
      file: option({
        string: true,
        description:
          "If passed, will try to resolve the lambda name from specified file",
      }),
      prune: option({
        string: true,
        choices: PRUNE_OPTIONS,
        default: Prune.ask,
        description: "Should we run npm prune if zip file size is too big.",
      }),
    });
  }

  async handler(args: ArgsOf<this>) {
    this.playSound = !args.quiet;

    const lambdaName = await this.getLambdaName(args);

    if (args.dir) {
      await zip(args.dir, args.prune);
      await upload(args.dir, lambdaName, args.region);
      await cleanup(args.dir);
      return "Done!";
    }

    const config = await getAwsLambdaTransform();
    let folder = await getAwsArtifactDir(config);
    if (config.archiveSystem === "archive_nodejs") {
      await commandExec(`ln -sf ${config.root}/node_modules/ ${folder}`);
    }

    await build(args.build);
    await zip(folder, args.prune);
    await upload(folder, lambdaName, args.region);
    await cleanup(folder);

    return "Done!";
  }

  async getLambdaName(args: ArgsOf<this>): Promise<string> {
    if (args.file) {
      cliInfo("Resolving lambda name from file");
      const name = path.parse(args.file).name.toLowerCase();
      const names = await getLambdaNames();
      const foundNames = names.filter((n) => n.toLowerCase().includes(name));
      if (!foundNames.length) {
        throw new Error("Could not match current file to a lambda");
      } else if (foundNames.length === 1) {
        return foundNames[0];
      } else {
        throw new Error(
          `More than 1 lambda name matches the file: ${JSON.stringify(
            foundNames,
          )}`,
        );
      }
    } else {
      return this.argAt<string>(1, `Usage: jst ${this.name} [lambda-name]`);
    }
  }
}

async function build(build: string): Promise<void> {
  switch (build) {
    case "brazil":
      cliInfo("building");
      await commandExec("brazil-build release");
      break;
    case "npm":
      cliInfo("building");
      await commandExec("npm run build");
      break;
    case "none":
      break;
  }
}

async function zip(folder: string, prune: string): Promise<void> {
  cliInfo(`Zipping content ${folder}`);

  if (prune === Prune.always) {
    await commandExec(`npm prune --production`);
  }
  await commandExec(`cd ${folder} && zip -r9 lambda.zip . > /dev/null 2>&1`);

  if ([Prune.ask, Prune.yes].includes(prune as any)) {
    cliInfo("Checking content size");
    const diskUsage = await commandExec(`stat -f%z ${folder}/lambda.zip`, {
      quiet: true,
    });
    const size = diskUsage.join(" ").trim();
    if (Number(size) > 70000000) {
      const result = await promptUser(
        "Lambda is too big, should we run 'npm prune --production'? (y/N)",
      );
      if (["y", "yes"].includes(result.toLowerCase())) {
        await commandExec(`npm prune --production`);
        await cleanup(folder);
        return zip(folder, Prune.no);
      } else {
        throw new Error("Too big");
      }
    } else {
      cliInfo(`Acceptable zip size: ${size} <= 70000000`);
    }
  }
}

async function upload(folder: string, lambdaName: string, region?: string): Promise<void> {
  cliInfo(`Uploading content`);
  await adaAuth();

  const client = new LambdaClient({
    credentials: fromIni(),
    region,
  });
  try {
    await client.send(
      new UpdateFunctionCodeCommand({
        FunctionName: lambdaName,
        ZipFile: await fs.readFile(path.join(folder, "lambda.zip")),
      }),
    );
  } catch (error) {
    if (error instanceof ResourceNotFoundException) {
      cliWarn(`Lambda ${lambdaName} not found, trying to infer what You meant`);
      const result = await client.send(new ListFunctionsCommand());
      const options: string[] =
        result.Functions?.map((fn) => fn.FunctionName || "") || [];
      const newLambdaFunction = await inferOptionOrAsk(lambdaName, options);
      if (newLambdaFunction) return upload(folder, newLambdaFunction, region);
    }
    throw error;
  }
}

async function cleanup(folder: string) {
  cliInfo("removing lambda.zip");
  await rm(`${folder}/lambda.zip`);
}
