import { commandExec } from '../utils/exec';

export async function getChangedFiles(projectPath: string): Promise<string[]> {
  const results = await commandExec(`git -C ${projectPath} diff --name-only`);

  return results
    .join("")
    .split("\n")
    .map((filePath) => filePath.trim())
    .filter(Boolean);
}