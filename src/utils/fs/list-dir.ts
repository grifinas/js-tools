import * as fs from "fs/promises";
export async function listDir(path: string) {
  return fs.readdir(path);
}
