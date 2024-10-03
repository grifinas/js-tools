import { recursiveStatFile } from "../utils/fs/recursive-stat-file";

export async function getAwsPackageInfo(): Promise<string> {
  const { dir } = await recursiveStatFile("./packageInfo");
  return dir;
}
