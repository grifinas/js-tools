import { ArgsOf, bindCommand, Command } from "../utils/command";
import { option, withStage } from "../utils/stage";
import { CloudWatchLogs, LogStream } from "@aws-sdk/client-cloudwatch-logs";
import { GetLogEventsCommandOutput } from "@aws-sdk/client-cloudwatch-logs/dist-types/commands/GetLogEventsCommand";
import { open } from "fs/promises";
import { write, close } from "node:fs";
import { createBucket } from "../actions/createBucket";
import { adaAuth } from "../actions/adaAuth";
import { cliInfo } from "../utils/logger";

@bindCommand("Get Logs")
export class GetLogs extends Command {
  private cloudWatch: CloudWatchLogs | undefined;

  builder() {
    return withStage({
      region: option({
        string: true,
        alias: "r",
        description: "Region to query, default us-east-1",
        default: "us-east-1",
      }),
      max: option({
        number: true,
        alias: "m",
        default: 5,
      }),
      stream: option({
        string: true,
      }),
      quiet: option({
        boolean: true,
        default: false,
      }),
      s3: option({
        string: true,
      }),
      interactive: option({
        boolean: true,
        default: false,
      }),
    });
  }

  async handler(args: ArgsOf<this>): Promise<void> {
    this.playSound = Boolean(args.quiet);
    await adaAuth();

    this.cloudWatch = new CloudWatchLogs({
      region: args.region,
    });

    const logGroupName = this.argAt<string>(
      1,
      "Usage: jst get-logs [log-group-name]",
    );

    if (args.s3 !== undefined && args.stream) {
      const name = args.s3 ? args.s3 : await createBucket(args.stream);
      await this.exportLogs(name, logGroupName, args.stream);
      return;
    }
    if (args.stream) {
      await this.logsFromStream(logGroupName, args.stream);
      return;
    }

    cliInfo(`Getting log streams from ${logGroupName}`);
    const { logStreams = [] } = await this.cloudWatch.describeLogStreams({
      logGroupName,
      orderBy: "LastEventTime",
      descending: true,
      limit: Number(args.max),
    });

    if (!logStreams.length) {
      throw new Error(`No streams found in logGroup: ${args.logGroup}`);
    }

    cliInfo(logStreams.map((_) => _.logStreamName));
    cliInfo(`Found ${logStreams.length}/${args.max} streams`);

    const promises = logStreams.map(async (logStream: LogStream) => {
      await this.logsFromStream(logGroupName, logStream.logStreamName!);
    });

    await Promise.all(promises);
  }

  async exportLogs(
    bucket: string,
    logGroupName: string,
    logStreamName: string,
  ) {
    const fixedFileName = logGroupName.canonical() + ".json";
    console.info(
      `Writing ${logGroupName}/${logStreamName} to ${fixedFileName}`,
    );
    if (!this.cloudWatch) {
      throw new Error("Logging with no cloudwatch");
    }

    const to = new Date();
    const from = new Date();
    from.setHours(from.getHours() - 24);

    await this.cloudWatch.createExportTask({
      logGroupName,
      logStreamNamePrefix: logStreamName,
      destination: bucket,
      to: to.getTime(),
      from: from.getTime(),
    });
  }

  async logsFromStream(logGroupName: string, logStreamName: string) {
    const fixedFileName = logStreamName.canonical() + ".json";
    console.info(
      `Writing ${logGroupName}/${logStreamName} to ${fixedFileName}`,
    );
    if (!this.cloudWatch) {
      throw new Error("Logging with no cloudwatch");
    }
    const streamFile = await open(fixedFileName, "w");
    let nextToken: string | undefined =
      "f/38898486337889012063682019591984604297948411592870601860/s";
    let lastWrite: Promise<void> = Promise.resolve();
    let pageCounter = 0;
    try {
      do {
        //Read some logs
        const output: GetLogEventsCommandOutput =
          await this.cloudWatch.getLogEvents({
            logGroupName,
            logStreamName,
            startFromHead: true,
            nextToken,
          });
        //Make sure the last ones are written
        await lastWrite;
        //WTF is backward token?
        // if (output.nextBackwardToken)
        //   throw new Error("Turns out i need to cover backward token use case");
        nextToken = output.nextForwardToken;
        pageCounter++;
        console.log(
          "next token",
          nextToken,
          streamFile.fd,
          "page:",
          pageCounter,
        );
        const { events = [] } = output;

        if (events.length === 0) return;
        //Start a write
        lastWrite = new Promise((resolve, reject) => {
          write(
            streamFile.fd,
            JSON.stringify(events, null, 2),
            (err, written) => {
              if (err) {
                console.log(err);
                reject(new Error("Failed to write"));
              }
              if (written) resolve();
            },
          );
        });
      } while (nextToken);
    } finally {
      close(streamFile.fd);
    }
  }
}
