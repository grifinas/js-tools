import * as fs from "fs/promises";
export async function listDir(path: string): Promise<string[]> {
  return fs.readdir(path);
}
