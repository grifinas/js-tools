import { ArgsOf, bindCommand, Command } from "../utils/command";
import { getAwsArtifactDir } from "../actions/getAwsArtifactDir";
import { rm } from "fs/promises";
import { option, withStage } from "../utils/stage";
import { Options } from "yargs";
import { commandExec } from "../utils/exec";
import { adaAuth } from "../actions/adaAuth";
import { getAwsProjectConfig } from "../actions/getAwsProjectConfig";

@bindCommand("update-code [lambda-name] updates the code of specified lambda")
export class UpdateCode extends Command {
  builder() {
    return withStage({
      build: {
        choices: ["brazil", "npm", "none"],
        type: "string",
        alias: "b",
        default: "brazil",
        describe: "what command to use to build the application",
      } as Options,
      quiet: option({
        boolean: true,
        alias: "q",
        default: false,
        describe: "if True no sound is played when finished",
      }),
    });
  }

  async handler(args: ArgsOf<this>) {
    const lambdaName = this.argAt<string>(
      1,
      `Usage: jst ${this.name} [lambda-name]`,
    );
    const config = await getAwsProjectConfig();
    let folder = await getAwsArtifactDir(config);
    if (config.archiveSystem === "archive_nodejs") {
      await commandExec(`ln -sf ${config.root}/node_modules/ ${folder}`);
    }

    await build(args.build)
      .then(zip(folder))
      .then(upload(folder, lambdaName))
      .then(cleanup(folder));

    if (!args.nosound) {
      await commandExec("printf '\\7'");
    }

    return "Done!";
  }
}

async function build(build: string): Promise<void> {
  switch (build) {
    case "brazil":
      console.log("building");
      await commandExec("brazil-build");
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

function upload(folder: string, lambdaName: string) {
  return async () => {
    console.log(`Uploading content`);
    await adaAuth();

    await commandExec(
      `cd ${folder} && aws lambda update-function-code --function-name ${lambdaName} --zip-file fileb://lambda.zip`,
    );
  };
}

function cleanup(folder: string) {
  return async () => {
    console.log("removing lambda.zip");
    await rm(`${folder}/lambda.zip`);
  };
}
