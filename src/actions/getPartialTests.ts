import { getDependencyTree } from "./getDependencyTree";
import { commandExec } from "../utils/exec";
import { cliDebug, cliError, cliInfo, cliWarn } from "../utils/logger";
import * as path from "path";
import { listDir } from "../utils/fs/list-dir";
import { getVerbosity } from '../utils/verbosity';
import { getChangedFiles } from './getChangedFiles';

type Options = {
  testExtensions: string[];
  mirror: boolean;
}

type Impact = {
  filePath: string;
  dependency: string;
}

export async function getPartialTests(
  projectPath: string,
  options: Options,
): Promise<string[]> {
  return new PartialTests(projectPath, options).go();
}

class PartialTests {
  private testDirListings = new Map<string, Promise<string[]>>();

  constructor(private readonly projectPath: string, private readonly options: Options) {
  }

  async go() {
    const dependencyTree = this.toRelativeDependencyTree(getDependencyTree(this.projectPath));
    const changedFiles = await getChangedFiles(this.projectPath);
    const tests = new Set<string>();

    for (const changedFile of changedFiles.filter(this.isTestFile.bind(this))) {
      cliDebug(`test selected: ${changedFile} was changed directly`);
      tests.add(path.resolve(this.projectPath, changedFile));
    }

    cliDebug("Will look for tests in the /test dir with", this.options.testExtensions);
    for (const filePath of getImpactedFiles(dependencyTree, changedFiles)) {
      const testPaths = this.options.mirror
        ? await this.getMirroredTestPaths(
          filePath,
        )
        : await this.getTestPaths(filePath);

      for (const testPath of testPaths) {
        cliDebug(
          `test selected: ${testPath} mirrors impacted file ${filePath}`,
        );
        tests.add(path.resolve(this.projectPath, testPath));
      }
    }

    const result = Array.from(tests).sort();

    cliDebug("final tests:");
    for (const testPath of result) {
      cliDebug(`  ${path.relative(this.projectPath, testPath)}`);
    }

    return result;
  }

  private toRelativeDependencyTree(
    dependencyTree: Record<string, { path: string; dependency: string }[]>,
  ): Record<string, { path: string; dependency: string }[]> {
    return Object.fromEntries(
      Object.entries(dependencyTree).map(([filePath, dependencies]) => [
        path.relative(this.projectPath, filePath),
        dependencies.map((dependency) => ({
          ...dependency,
          path: path.relative(this.projectPath, dependency.path),
        })),
      ]),
    );
  }

  private isTestFile(filePath: string): boolean {
    const extension = path.extname(filePath)
    const inTestDir = filePath.includes('/test/');
    const hasRightExtension = this.options.testExtensions.some(
      (testExtension) =>
        filePath.endsWith(`${normalizeTestExtension(testExtension)}${extension}`),
    );
    return inTestDir && hasRightExtension;
  }

  private async getMirroredTestPaths(
    filePath: string,
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

    const testDir = path.join(...pathParts.slice(0, -1));
    const testFileNames = await this.listTestDir(testDir);
    cliDebug("For file", filePath, "test dir", testDir, "with names", testFileNames);
    const matchingTestFileNames = testFileNames.filter(this.isTestFile.bind(this));

    if (matchingTestFileNames.length === 0) {
      cliDebug(
        `test skipped: no mirrored tests found in ${testDir} for ${filePath}`,
      );
    }

    return matchingTestFileNames.map((testFileName) => path.join(testDir, testFileName));
  }

  private async getTestPaths(
    filePath: string,
  ): Promise<string[]> {
    const testFileNames = await this.listTestDir('test', true);
    if (!printed) {
      cliDebug(JSON.stringify(testFileNames, null, 2));
      printed = true;
    }
    const baseName = path.basename(filePath, path.extname(filePath));

    cliDebug("found", testFileNames.length, "test candidates for", filePath, "basename:", baseName);
    const matchingTestFileNames = testFileNames.filter(testFile => {
      return testFile.includes(baseName) && this.isTestFile(testFile);
    })

    if (matchingTestFileNames.length === 0) {
      cliDebug(
        `test skipped: no mirrored tests found for ${filePath}`,
      );
    }

    return matchingTestFileNames;
  }

  private async listTestDir(
    testDir: string,
    recursive: boolean = false,
  ): Promise<string[]> {
    if (!this.testDirListings.has(testDir)) {
      const dir = path.resolve(this.projectPath, testDir)
      cliInfo("Reading Dir", dir)
      this.testDirListings.set(
        testDir,
        listDir(dir, recursive).then(files => {
          return files.map(filePath => path.resolve(dir, filePath));
        }).catch((e) => {
          cliDebug(`test skipped: unable to list ${testDir}`);
          cliError("Error listing dir", testDir, e);
          return [];
        }),
      );
    }

    return this.testDirListings.get(testDir)!;
  }
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

let printed = false;

function isSourceFile(filePath: string): boolean {
  return filePath.split(path.sep)[0] === "src";
}

function normalizeTestExtension(testExtension: string): string {
  return testExtension.endsWith(".") ? testExtension.slice(0, -1) : testExtension;
}