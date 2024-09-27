import { ArgsOf, bindCommand, Command } from "../utils/command";
import { getAwsArtifactDir } from "../actions/getAwsArtifactDir";
import { getAwsLambdaTransform } from "../actions/getAwsLambdaTransform";

@bindCommand(
  "Gets the full path to aws artifact directory where artifact was built",
)
export class GetAwsArtifactDir extends Command {
  async handler(args: ArgsOf<this>) {
    const config = await getAwsLambdaTransform();
    return getAwsArtifactDir(config);
  }
}
