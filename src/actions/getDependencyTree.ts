import { readTsconfig } from "./readTsconfig";
import * as path from "path";
import ts from "typescript";

export interface Dependency {
  path: string;
  dependency: string;
}

export function getDependencyTree(projectPath: string): Record<string, Dependency[]> {
  const parsedConfig = readTsconfig(projectPath);
  const program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
  const checker = program.getTypeChecker();
  const output: Record<string, Dependency[]> = {};

  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile || !isProjectFile(sourceFile.fileName, projectPath)) {
      continue;
    }

    output[path.resolve(sourceFile.fileName)] = getImportDependencies(
      sourceFile,
      checker,
      program,
      projectPath,
    );
  }

  return output;
}

function getImportDependencies(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
  program: ts.Program,
  projectPath: string,
): Dependency[] {
  const dependencies = new Map<string, Dependency>();

  sourceFile.forEachChild((node) => {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) {
      return;
    }

    const importClause = node.importClause;
    if (!importClause) {
      return;
    }

    const importedNodes = getImportedNodes(importClause);
    for (const importedNode of importedNodes) {
      const symbol = checker.getSymbolAtLocation(importedNode);
      const dependency = getFunctionOrClassDependency(symbol, program);

      if (dependency && isProjectFile(dependency.path, projectPath)) {
        dependencies.set(`${dependency.path}:${dependency.dependency}`, dependency);
      }
    }
  });

  return Array.from(dependencies.values()).sort((left, right) => {
    const pathComparison = left.path.localeCompare(right.path);

    return pathComparison || left.dependency.localeCompare(right.dependency);
  });
}

function getImportedNodes(importClause: ts.ImportClause): ts.Node[] {
  const nodes: ts.Node[] = [];

  if (importClause.name) {
    nodes.push(importClause.name);
  }

  if (importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
    for (const element of importClause.namedBindings.elements) {
      nodes.push(element.name);
    }
  }

  return nodes;
}

function getFunctionOrClassDependency(
  symbol: ts.Symbol | undefined,
  program: ts.Program,
): Dependency | null {
  if (!symbol) {
    return null;
  }

  const aliasedSymbol =
    symbol.flags & ts.SymbolFlags.Alias ? program.getTypeChecker().getAliasedSymbol(symbol) : symbol;

  for (const declaration of aliasedSymbol.declarations || []) {
    if (
      ts.isFunctionDeclaration(declaration) ||
      ts.isClassDeclaration(declaration) ||
      ts.isMethodDeclaration(declaration) ||
      ts.isFunctionExpression(declaration) ||
      ts.isArrowFunction(declaration)
    ) {
      return {
        path: path.resolve(declaration.getSourceFile().fileName),
        dependency: aliasedSymbol.getName(),
      };
    }
  }

  return null;
}

function isProjectFile(filePath: string, projectPath: string): boolean {
  const relativePath = path.relative(projectPath, filePath);

  return (
    !relativePath.startsWith("..") &&
    !path.isAbsolute(relativePath) &&
    !relativePath.split(path.sep).includes("node_modules")
  );
}
