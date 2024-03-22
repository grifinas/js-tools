import { recursiveStatFile } from "../utils/fs/recursive-stat-file";

export async function getAwsPackageInfo(): Promise<string> {
  const stat = await recursiveStatFile("./packageInfo");
  return stat.path.replace(/\/packageInfo$/, "");
}
