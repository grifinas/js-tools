import { recursiveStatFile } from '../utils/fs/recursive-stat-file';
import { loadYamlFile } from '../utils/fs/load-yaml-file';

export async function getAwsArtifactDir() {
  const { path } = await recursiveStatFile('./Config');
  const directoryPath = path.replace(/\/Config$/, '');
  const transformPath = directoryPath + '/configuration/aws_lambda/lambda-transform.yml';

  const { handler_path } = await loadYamlFile<{ handler_path?: string }>(transformPath);

  if (handler_path) {
    return `${directoryPath}/build/${handler_path}`;
  }

  throw new Error('Failed to find handler path in lambda-transform.yml.');
}