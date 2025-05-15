import { ArgsOf, bindCommand, Command } from "../utils/command";
import { adaAuth } from "../actions/adaAuth";
import { withStage } from "../utils/stage";
import { listAwsServices } from "../actions/listAwsServices";

@bindCommand("List Aws Services")
export class ListAwsServices extends Command {
  builder() {
    return withStage({});
  }

  async handler(args: ArgsOf<this>): Promise<void> {
    await adaAuth();
    console.log(JSON.stringify(await listAwsServices(), null, 2));
  }
}
