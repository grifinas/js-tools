import { commandExec } from "../utils/exec";
import { createWriteStream } from "node:fs";

export async function getCode(
  functionName: string,
  path: string = "lambda",
): Promise<string> {
  const result = await commandExec(
    `aws lambda get-function --function=${functionName}`,
    {
      quiet: true,
    },
  );

  const config = JSON.parse(result.join(""));

  const url = config["Code"]["Location"];
  console.log(`Fetching code from ${config["Code"]["RepositoryType"]}`);

  const outputPath = "./downloaded-file.zip";

  const code = await fetch(url);

  if (!code.ok || !code.body) {
    throw new Error(`Fetch failed with status ${code.status}`);
  }

  const reader = code.body.getReader();
  const writer = createWriteStream(outputPath);

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    writer.write(value);
  }

  console.log(`Fetched lambda locally @${outputPath}, unzipping`);

  await commandExec(`unzip -d ${path} ${outputPath}`);

  return path;
}
