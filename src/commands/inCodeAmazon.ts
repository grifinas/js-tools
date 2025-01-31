import { ArgsOf, bindCommand, Command } from "../utils/command";
import { option } from "../utils/stage";
import { getAwsProjectConfig } from "../actions/getAwsProjectConfig";
import * as path from "path";

@bindCommand("In Code Amazon")
export class InCodeAmazon extends Command {
  builder() {
    return {
      file: option({
        string: true,
        description: "File to link in code.amazon.com",
      }),
      line: option({
        number: true,
        description: "Line to link in code.amazon.com",
      }),
    };
  }

  async handler(args: ArgsOf<this>): Promise<void> {
    const { file, line } = args;

    const { path: configPath, data: config } = await getAwsProjectConfig(
      path.dirname(file),
      true,
    );
    const packageName = Object.keys(config)[0];
    const pathToFile = file.replace(path.dirname(configPath), "");
    const lineString = line ? `#L${line}` : "";
    const url = `https://code.amazon.com/packages/${packageName}/blobs/mainline/--${pathToFile}${lineString}`;
    console.log(url);
  }
}
