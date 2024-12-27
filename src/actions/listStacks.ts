import { recursiveStatFile } from "../utils/fs/recursive-stat-file";
import path from "path";
import * as fs from "fs/promises";
import { getAwsProjectConfig } from "./getAwsProjectConfig";

interface Target {
  subTargets: {
    tags: Record<string, string>;
    target: {
      id: {
        stackArn?: string;
      };
    };
  }[];
}

interface Pipeline {
  targets: Target[];
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
  //Build should reside in the same place as packageInfo
  const { dir } = await recursiveStatFile("./packageInfo");
  const { data } = await getAwsProjectConfig();
  const packageName = Object.keys(data)[0];
  const pathToPipeline = path.join(
    dir,
    "build",
    packageName,
    //FIXME this is maybe not always correct
    `${packageName}-1.0/AL2_x86_64/DEV.STD.PTHREAD/build/pipeline-structure/Pipeline.json`,
  );
  let json: Pipeline | null = null;
  try {
    const buffer = await fs.readFile(pathToPipeline);
    const content = buffer.toString("utf-8");
    json = JSON.parse(content);
  } catch (e) {
    throw new ListStacksError("Failed to load pipeline", e);
  }

  const stacks: Set<string> = new Set();

  try {
    const targets = json?.targets || [];
    targets.forEach((ultraGigaTarget) => {
      const { subTargets = [] } = ultraGigaTarget;
      subTargets.forEach(({ target, tags }) => {
        //Pipeline stacks
        if (target.id.stackArn) {
          const stackArn = target.id.stackArn;
          const stackName = stackArn.substring(stackArn.lastIndexOf("/") + 1);
          stacks.add(stackName);
        }

        //Stacks not a part of the pipeline, but as dependencies
        const dependencies: string = tags.DependOn || "";
        const STACK_IDENTIFIER = ":stack/";
        dependencies.split(",").forEach((dep) => {
          const stackIndex = dep.lastIndexOf(STACK_IDENTIFIER);
          if (stackIndex > -1) {
            stacks.add(
              dep.substring(stackIndex + STACK_IDENTIFIER.length).trim(),
            );
          }
        });
      });
    });

    return Array.from(stacks);
  } catch (e) {
    throw new ListStacksError("Failed to parse stacks from Pipeline.json", e);
  }
}
