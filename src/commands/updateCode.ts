import { ArgsOf, bindCommand, Command } from "../utils/command";
import { getAwsArtifactDir } from "../actions/getAwsArtifactDir";
import { rm } from "fs/promises";
import { option, withStage } from "../utils/stage";
import { Options } from "yargs";
import { commandExec } from "../utils/exec";
import { adaAuth } from "../actions/adaAuth";
import { getAwsLambdaTransform } from "../actions/getAwsLambdaTransform";
import { getLambdaNames } from "../actions/getLambdaNames";
import * as path from "path";

@bindCommand("update-code [lambda-name] updates the code of specified lambda")
export class UpdateCode extends Command {
  builder() {
    return withStage({
      build: {
        choices: ["brazil", "npm", "none"],
        type: "string",
        alias: "b",
        default: "brazil",
        describe: "What command to use to build the application",
      } as Options,
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
    });
  }

  async handler(args: ArgsOf<this>) {
    const lambdaName = await this.getLambdaName(args);
    const config = await getAwsLambdaTransform();
    let folder = await getAwsArtifactDir(config);
    if (config.archiveSystem === "archive_nodejs") {
      await commandExec(`ln -sf ${config.root}/node_modules/ ${folder}`);
    }

    await build(args.build)
      .then(zip(folder))
      .then(upload(folder, lambdaName, args.region))
      .then(cleanup(folder));

    if (!args.nosound) {
      await commandExec("printf '\\7'");
    }

    return "Done!";
  }

  async getLambdaName(args: ArgsOf<this>): Promise<string> {
    if (args.file) {
      console.info("Resolving lambda name from file");
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
      console.log("building");
      await commandExec("brazil-build release");
      break;
    case "npm":
      console.log("building");
      await commandExec("npm run build");
      break;
    case "none":
      break;
  }
}

function zip(folder: string) {
  return async () => {
    console.log(`Zipping content ${folder}`);

    await commandExec(`cd ${folder} && zip -r9 lambda.zip . > /dev/null 2>&1`);
  };
}

function upload(folder: string, lambdaName: string, region?: string) {
  return async () => {
    console.log(`Uploading content`);
    await adaAuth();

    await commandExec(
      `cd ${folder} && aws lambda update-function-code --function-name ${lambdaName} ${
        region ? `--region ${region}` : ""
      } --zip-file fileb://lambda.zip`,
    );
  };
}

function cleanup(folder: string) {
  return async () => {
    console.log("removing lambda.zip");
    await rm(`${folder}/lambda.zip`);
  };
}
