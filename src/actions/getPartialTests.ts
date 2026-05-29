import { getDependencyTree } from "./getDependencyTree";
import { commandExec } from "../utils/exec";
import * as fs from "fs";
import * as path from "path";

export async function getPartialTests(
  projectPath: string,
  verbose: boolean = false,
): Promise<string[]> {
  const dependencyTree = getDependencyTree(projectPath);
  const changedFiles = await getChangedFiles(projectPath);
  const impactedFiles = getImpactedFiles(dependencyTree, changedFiles, verbose);
  const tests = new Set<string>();

  verboseLog(verbose, "git diff changed files:");
  for (const changedFile of changedFiles) {
    verboseLog(verbose, `  ${changedFile}`);
  }

  for (const filePath of impactedFiles) {
    const testPath = getMirroredTestPath(projectPath, filePath);

    if (testPath && fs.existsSync(testPath)) {
      verboseLog(verbose, `test selected: ${testPath} mirrors impacted file ${filePath}`);
      tests.add(testPath);
    } else if (testPath) {
      verboseLog(verbose, `test skipped: ${testPath} does not exist for impacted file ${filePath}`);
    }
  }

  const result = Array.from(tests).sort();

  verboseLog(verbose, "final tests:");
  for (const testPath of result) {
    verboseLog(verbose, `  ${testPath}`);
  }

  return result;
}

async function getChangedFiles(projectPath: string): Promise<string[]> {
  const results = await commandExec(`git -C ${projectPath} diff --name-only`, {
    noecho: true,
    quiet: true,
  });

  return results
    .join("")
    .split("\n")
    .map((filePath) => filePath.trim())
    .filter(Boolean)
    .map((filePath) => path.resolve(projectPath, filePath));
}

function getImpactedFiles(
  dependencyTree: Record<string, { path: string; dependency: string }[]>,
  changedFiles: string[],
  verbose: boolean,
): string[] {
  const impactingTree = invertDependencyTree(dependencyTree);
  const impactedFiles = new Set<string>();
  const filesToVisit = [...changedFiles];

  while (filesToVisit.length > 0) {
    const filePath = filesToVisit.pop();

    if (!filePath || impactedFiles.has(filePath)) {
      continue;
    }

    impactedFiles.add(filePath);
    verboseLog(verbose, `impacted: ${filePath}`);

    for (const impact of impactingTree[filePath] || []) {
      verboseLog(
        verbose,
        `  ${impact.filePath} is impacted because it imports ${impact.dependency} from ${filePath}`,
      );
      filesToVisit.push(impact.filePath);
    }
  }

  return Array.from(impactedFiles);
}

function invertDependencyTree(
  dependencyTree: Record<string, { path: string; dependency: string }[]>,
): Record<string, Impact[]> {
  const impactingTree: Record<string, Impact[]> = {};

  for (const [filePath, dependencies] of Object.entries(dependencyTree)) {
    for (const dependency of dependencies) {
      impactingTree[dependency.path] = impactingTree[dependency.path] || [];
      impactingTree[dependency.path].push({
        filePath,
        dependency: dependency.dependency,
      });
    }
  }

  return impactingTree;
}

interface Impact {
  filePath: string;
  dependency: string;
}

function getMirroredTestPath(projectPath: string, filePath: string): string | null {
  const relativePath = path.relative(projectPath, filePath);
  const pathParts = relativePath.split(path.sep);

  if (pathParts[0] === "test") {
    return filePath;
  }

  if (pathParts[0] === "src") {
    pathParts[0] = "test";
  } else {
    pathParts.unshift("test");
  }

  const extension = path.extname(pathParts[pathParts.length - 1]);
  const basename = path.basename(pathParts[pathParts.length - 1], extension);

  pathParts[pathParts.length - 1] = `${basename}.test${extension}`;

  return path.resolve(projectPath, ...pathParts);
}

function verboseLog(verbose: boolean, message: string): void {
  if (verbose) {
    console.log(message);
  }
}
