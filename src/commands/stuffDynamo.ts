import { ArgsOf, bindCommand, Command } from "../utils/command";
import { option, withStage } from "../utils/stage";
import { adaAuth } from "../actions/adaAuth";
import { chunk } from "lodash";
import { fromIni } from "@aws-sdk/credential-providers";
import {
  AttributeValue,
  DynamoDBClient,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";

let largestTimestamp = 0;
@bindCommand("stuff DynamoDB with data")
export class StuffDynamo extends Command {
  private dynamoDbClient: DynamoDBClient | null = null;

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
    this.dynamoDbClient = new DynamoDBClient({
      credentials: fromIni({ profile: "default" }),
    });

    // await this.chunky(args);
    await this.straight();

    console.log("DONE");
  }

  async straight() {
    const usernames: string[] = [
      "dylhjohn",
      "cathrowa",
      "gibmat",
      "sqlkavi",
      "spallchr",
      "isaacjs",
    ];

    for (let username of usernames) {
      const item = this.generateAbTestResult(username);
      console.log("Putting", item);
      await this.dynamoDbClient!.send(
        new PutItemCommand({
          Item: item,
          TableName: "AbResults",
        }),
      );
    }
  }

  async chunky(args: ArgsOf<this>) {
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
          await this.dynamoDbClient!.send(
            new PutItemCommand({
              Item: item,
              TableName: "AbResults",
            }),
          );
        }),
      );
    }
  }

  generateAbTestResult(username: string): Record<string, AttributeValue> {
    return {
      serviceUsernamePK: {
        S: `AccessLevels#${username}`,
      },
      configName: {
        S: "accessLevelsStageTwo",
      },
      result: { S: "on" },
    };
  }

  generateItem(i: number): Record<string, any> {
    const now = new Date().getTime();
    largestTimestamp++;
    const timestamp = now > largestTimestamp ? now : largestTimestamp;
    largestTimestamp = timestamp;

    return {
      serviceUsernamePK: {
        S: "AccessLevels#koiiryna",
      },
      configName: {
        S: "accessLevelsStageTwo",
      },
      result: {
        S: "on",
      },
    };
  }
}
