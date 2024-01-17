import { ArgsOf, bindCommand, Command } from '../utils/command';
import { getAwsArtifactDir } from '../actions/getAwsArtifactDir';

@bindCommand('Gets the full path to aws artifact directory where artifact was built')
export class GetAwsArtifactDir extends Command {
    async handler(args: ArgsOf<this>) {
        return getAwsArtifactDir();
    }
}