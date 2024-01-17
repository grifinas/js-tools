import { ArgsOf, bindCommand, Command } from "../utils/command";
import { option, withStage } from "../utils/stage";
import { commandExec } from "../utils/exec";
import { adaAuth } from "../actions/adaAuth";
import { writeFile } from "fs/promises";
import { v4 } from "uuid";
import { chunk } from "lodash";

let largestTimestamp = 0;
@bindCommand("stuff DynamoDB with data")
export class StuffDynamo extends Command {
  builder() {
    return withStage({
      count: option({
        number: true,
        alias: "c",
        default: 1,
      }),
      chunk: option({
        number: true,
        alias: "h",
        default: 25,
      }),
    });
  }

  async handler(args: ArgsOf<this>) {
    await adaAuth();
    const { count } = args;

    const range = Array(Number(count))
      .fill(null)
      .map((_, i) => i);
    const chunks = chunk(range, Number(args.chunk));

    for (const numbers of chunks) {
      const i = chunks.indexOf(numbers);
      console.log(i, "/", chunks.length);
      await Promise.all(
        numbers.map(async (n, i) => {
          const item = this.generateItem(i);
          await writeFile(`item${i}.json`, JSON.stringify(item));
          await commandExec(
            `aws dynamodb put-item --table-name UserActions --item file://item${i}.json`,
            { noecho: true },
          );
        }),
      );
    }

    console.log("DONE");
  }

  generateItem(i: number): Record<string, any> {
    const now = new Date().getTime();
    largestTimestamp++;
    const timestamp = now > largestTimestamp ? now : largestTimestamp;
    largestTimestamp = timestamp;

    return {
      actionName: {
        S: "Set Input Mask",
      },
      timestamp: {
        S: timestamp.toString(),
      },
      actionId: {
        S: v4(),
      },
      deviceName: {
        S: "SEA74-1F SEC OFC BYPASS EDR",
      },
      deviceSource: {
        S: "onguard",
      },
      isMasked: {
        BOOL: true,
      },
      requestedBy: {
        S: ["paulminy", "kdomanta", "pinovica"][i % 3],
      },
      siteName: {
        S: "SEA74",
      },
      siteRegion: {
        S: "AMER",
      },
    };
  }
}
