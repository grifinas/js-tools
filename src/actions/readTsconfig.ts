import * as fs from "fs";
import * as path from "path";
import ts from "typescript";

export function readTsconfig(projectPath: string): ts.ParsedCommandLine {
  let currentPath = projectPath;

  while (true) {
    const tsconfigPath = path.join(currentPath, "tsconfig.json");
    if (fs.existsSync(tsconfigPath)) {
      return parseTsconfig(tsconfigPath);
    }

    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) {
      throw new Error(`Unable to find tsconfig.json from ${projectPath}`);
    }

    currentPath = parentPath;
  }
}

function parseTsconfig(tsconfigPath: string): ts.ParsedCommandLine {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);

  if (configFile.error) {
    throw new Error(formatTsError(configFile.error));
  }

  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(tsconfigPath),
  );

  if (parsedConfig.errors.length > 0) {
    throw new Error(parsedConfig.errors.map(formatTsError).join("\n"));
  }

  return parsedConfig;
}

function formatTsError(error: ts.Diagnostic): string {
  return ts.flattenDiagnosticMessageText(error.messageText, "\n");
}
