import { ArgsOf, bindCommand, Command } from "../utils/command";
import { getAwsArtifactDir } from "../actions/getAwsArtifactDir";
import { getAwsProjectConfig } from "../actions/getAwsProjectConfig";

@bindCommand(
  "Gets the full path to aws artifact directory where artifact was built",
)
export class GetAwsArtifactDir extends Command {
  async handler(args: ArgsOf<this>) {
    const config = await getAwsProjectConfig();
    return getAwsArtifactDir(config);
  }
}
