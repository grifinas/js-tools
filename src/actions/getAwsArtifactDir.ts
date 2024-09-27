import { ProjectConfig } from "./getAwsLambdaTransform";

export async function getAwsArtifactDir(config: ProjectConfig) {
  return `${config.root}/build/${config.handlerPath}`;
}
