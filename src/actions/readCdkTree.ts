import * as fs from "fs/promises";

interface Child {
  id: string;
  children?: Record<string, Child>;
  constructInfo: {
    fqn: string;
  };
}

interface Stack extends Child {}

interface Pipeline {
  tree: { children: Record<string, Stack> };
}

export async function readCdkTree(): Promise<Pipeline | null> {
  const pathToPipeline = "./build/cdk.out/tree.json";
  let json: Pipeline | null = null;
  try {
    const buffer = await fs.readFile(pathToPipeline);
    const content = buffer.toString("utf-8");
    json = JSON.parse(content);
  } catch (e) {
    throw new Error(
      "Failed to load pipeline, are you running this from a build CDK package?",
    );
  }

  return json;
}
