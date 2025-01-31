import * as fs from "fs/promises";

interface Stack {
  id: string;
  constructInfo: {
    fqn: string;
  };
}

interface Pipeline {
  tree: { children: Record<string, Stack> };
}

export class ListStacksError extends Error {
  constructor(
    message: string,
    public readonly prev: unknown,
  ) {
    super(message);
  }
}

export async function listStacks(): Promise<string[]> {
  const pathToPipeline = "./build/cdk.out/tree.json";
  let json: Pipeline | null = null;
  try {
    const buffer = await fs.readFile(pathToPipeline);
    const content = buffer.toString("utf-8");
    json = JSON.parse(content);
  } catch (e) {
    throw new ListStacksError("Failed to load pipeline", e);
  }

  if (!json) {
    return [];
  }

  const stacks: Set<string> = new Set();

  try {
    const treeStacks = json.tree.children || {};
    for (const stack in treeStacks) {
      if (
        treeStacks[stack].constructInfo.fqn ===
        "@amzn/pipelines.DeploymentStack"
      ) {
        stacks.add(stack);
      }
    }

    return Array.from(stacks);
  } catch (e) {
    throw new ListStacksError("Failed to parse stacks from tree.json", e);
  }
}
