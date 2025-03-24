import * as fs from "fs/promises";
import { FileNotFoundError } from "../errors";
import * as path from "path";
import { localToFqn } from "./local-to-fqn";

export interface RecursiveStatiFile {
  path: string;
  dir: string;
}

//Bet there's an easier way to do this
export async function recursiveStatFile(
  file: string,
  from?: string,
): Promise<RecursiveStatiFile> {
  const fullPath = from ? path.join(from, file) : localToFqn(file);
  const parts = fullPath.split("/");
  const fileName = parts.pop() as string;

  while (parts.length > 1) {
    const currentDir = parts.join("/");
    const statPath = path.join(currentDir, fileName);
    try {
      await fs.readFile(statPath);
      return {
        dir: currentDir,
        path: statPath,
      };
    } catch (e) {
      parts.pop();
    }
  }

  throw new FileNotFoundError(
    `Looked for ${file} file in ${fullPath} and up. But couldn't find one`,
  );
}
