import { readCdkTree } from "./readCdkTree";

export class ListStacksError extends Error {
  constructor(
    message: string,
    public readonly prev: unknown,
  ) {
    super(message);
  }
}

export async function listStacks(): Promise<string[]> {
  const tree = await readCdkTree();

  if (!tree) {
    return [];
  }

  const stacks: Set<string> = new Set();

  try {
    const treeStacks = tree.tree.children || {};
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
