import { recursiveStatFile } from "../utils/fs/recursive-stat-file";
import fs from "fs/promises";
import { tokenize } from "./tokenize";
import { lexConfig } from "./lexConfig";

export interface ProjectConfig {
  path: string;
  data: object;
}

export async function getAwsProjectConfig(
  from?: string,
  onlyRoot = false,
): Promise<ProjectConfig> {
  const { path } = await recursiveStatFile(`${from ?? "."}/Config`);
  const buffer = await fs.readFile(path);
  let content = buffer.toString("utf-8");

  return {
    path,
    data: lexConfig(tokenize(content), onlyRoot),
  };
}
