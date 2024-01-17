import { ArgsOf, bindCommand, Command } from '../utils/command';
import { Options } from 'yargs';
import { withStage } from '../utils/stage';
import { commandExec } from '../utils/exec';
import { adaAuth } from '../actions/adaAuth';

@bindCommand('dev-deploy [stack] deploys specified stack to AWS')
export class DevDeploy extends Command {
  builder() {
    return withStage({
      inclusive: {
        type: 'boolean',
        alias: 'i',
        default: false,
        describe: 'whether to include stack dependencies into the deployment process'
      } as Options
    });
  }

  async handler(args: ArgsOf<this>) {
    const stack = this.argAt(1, 'Usage: jst dev-deploy [stack]');

    await adaAuth();
    await commandExec(`cdk deploy "${stack}" --require-approval never ${args.inclusive ? '' : '--exclusively'}`)
  }
}