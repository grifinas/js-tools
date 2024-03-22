import { ProjectConfig } from "./getAwsProjectConfig";

export async function getAwsArtifactDir(config: ProjectConfig) {
  return `${config.root}/build/${config.handlerPath}`;
}
