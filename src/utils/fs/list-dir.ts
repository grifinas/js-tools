import * as fs from "fs/promises";

export async function listDir(path: string, recursive: boolean = false): Promise<string[]> {
  return fs.readdir(path, {
    recursive,
  });
}
