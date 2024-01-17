import { ArgsOf, bindCommand, Command } from '../utils/command';
import { getAwsAccount } from '../actions/getAwsAccount';
import { withStage } from '../utils/stage';

@bindCommand('Gets the AWS account id based on the current directory')
export class GetAwsAccount extends Command {
  builder() {
    return withStage({
    });
  }

  async handler(args: ArgsOf<this>) {
    return getAwsAccount(args.stage);
  }
}