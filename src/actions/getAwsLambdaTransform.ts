import { recursiveStatFile } from "../utils/fs/recursive-stat-file";
import { loadYamlFile } from "../utils/fs/load-yaml-file";

export interface ProjectConfig {
  root: string;
  handlerPath: string;
  archiveSystem: string;
}

export async function getAwsLambdaTransform(): Promise<ProjectConfig> {
  const { dir: directoryPath } = await recursiveStatFile("./Config");
  const transformPath =
    directoryPath + "/configuration/aws_lambda/lambda-transform.yml";

  const { handler_path, archive_system } = await loadYamlFile<{
    handler_path?: string;
    archive_system?: string;
  }>(transformPath);

  if (!handler_path || !archive_system) {
    throw new Error("Failed to find handler path in lambda-transform.yml.");
  }

  return {
    root: directoryPath,
    handlerPath: handler_path,
    archiveSystem: archive_system,
  };
}
