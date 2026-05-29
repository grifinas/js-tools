import { getDependencyTree } from "./getDependencyTree";
import { commandExec } from "../utils/exec";
import { cliDebug } from "../utils/logger";
import * as path from "path";
import { listDir } from "../utils/fs/list-dir";

const DEFAULT_TEST_EXTENSIONS = [".spec.", ".test.", ".it.", ".e2e."];

export async function getPartialTests(
  projectPath: string,
  testExtensions: string[] = DEFAULT_TEST_EXTENSIONS,
): Promise<string[]> {
  const effectiveTestExtensions = testExtensions.length
    ? testExtensions
    : DEFAULT_TEST_EXTENSIONS;
  const dependencyTree = toRelativeDependencyTree(projectPath, getDependencyTree(projectPath));
  const changedFiles = await getChangedFiles(projectPath);
  const testDirListings = new Map<string, Promise<string[]>>();
  const tests = new Set<string>();

  cliDebug("git diff changed files:");
  for (const changedFile of changedFiles) {
    cliDebug(`  ${changedFile}`);
  }

  for (const filePath of getChangedTestFiles(changedFiles)) {
    cliDebug(`test selected: ${filePath} was changed directly`);
    tests.add(path.resolve(projectPath, filePath));
  }

  for (const filePath of getImpactedFiles(dependencyTree, changedFiles)) {
    const testPaths = await getMirroredTestPaths(
      projectPath,
      filePath,
      effectiveTestExtensions,
      testDirListings,
    );

    for (const testPath of testPaths) {
      cliDebug(
        `test selected: ${testPath} mirrors impacted file ${filePath}`,
      );
      tests.add(path.resolve(projectPath, testPath));
    }
  }

  const result = Array.from(tests).sort();

  cliDebug("final tests:");
  for (const testPath of result) {
    cliDebug(`  ${path.relative(projectPath, testPath)}`);
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
    .filter(Boolean);
}

function getImpactedFiles(
  dependencyTree: Record<string, { path: string; dependency: string }[]>,
  changedFiles: string[],
): string[] {
  const impactingTree = invertDependencyTree(dependencyTree);
  const impactedFiles = new Set<string>();
  const filesToVisit = changedFiles.filter(isSourceFile);

  while (filesToVisit.length > 0) {
    const filePath = filesToVisit.pop();

    if (!filePath || impactedFiles.has(filePath)) {
      continue;
    }

    impactedFiles.add(filePath);
    cliDebug(`impacted: ${filePath}`);

    for (const impact of impactingTree[filePath] || []) {
      if (!isSourceFile(impact.filePath)) {
        cliDebug(`  skipped ${impact.filePath} because it is not a source file`);
        continue;
      }

      cliDebug(
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

async function getMirroredTestPaths(
  projectPath: string,
  filePath: string,
  testExtensions: string[],
  testDirListings: Map<string, Promise<string[]>>,
): Promise<string[]> {
  const pathParts = filePath.split(path.sep);

  if (pathParts[0] === "test") {
    return [filePath];
  }

  if (pathParts[0] === "src") {
    pathParts[0] = "test";
  } else {
    pathParts.unshift("test");
  }

  const extension = path.extname(pathParts[pathParts.length - 1]);
  const basename = path.basename(pathParts[pathParts.length - 1], extension);
  const testDir = path.join(...pathParts.slice(0, -1));
  const testFileNames = await listTestDir(projectPath, testDir, testDirListings);
  const matchingTestFileNames = testFileNames.filter((testFileName) =>
    testExtensions.some(
      (testExtension) =>
        testFileName === `${basename}${normalizeTestExtension(testExtension)}${extension}`,
    ),
  );

  if (matchingTestFileNames.length === 0) {
    cliDebug(
      `test skipped: no mirrored tests found in ${testDir} for ${filePath}`,
    );
  }

  return matchingTestFileNames.map((testFileName) => path.join(testDir, testFileName));
}

function getChangedTestFiles(changedFiles: string[]): string[] {
  return changedFiles.filter(isTestFile);
}

function isSourceFile(filePath: string): boolean {
  return filePath.split(path.sep)[0] === "src";
}

function isTestFile(filePath: string): boolean {
  return filePath.split(path.sep)[0] === "test";
}

function normalizeTestExtension(testExtension: string): string {
  return testExtension.endsWith(".") ? testExtension.slice(0, -1) : testExtension;
}

async function listTestDir(
  projectPath: string,
  testDir: string,
  testDirListings: Map<string, Promise<string[]>>,
): Promise<string[]> {
  if (!testDirListings.has(testDir)) {
    testDirListings.set(
      testDir,
      listDir(path.resolve(projectPath, testDir)).catch(() => {
        cliDebug(`test skipped: unable to list ${testDir}`);

        return [];
      }),
    );
  }

  return testDirListings.get(testDir)!;
}

function toRelativeDependencyTree(
  projectPath: string,
  dependencyTree: Record<string, { path: string; dependency: string }[]>,
): Record<string, { path: string; dependency: string }[]> {
  return Object.fromEntries(
    Object.entries(dependencyTree).map(([filePath, dependencies]) => [
      path.relative(projectPath, filePath),
      dependencies.map((dependency) => ({
        ...dependency,
        path: path.relative(projectPath, dependency.path),
      })),
    ]),
  );
}
