export class FileNotFoundError extends Error {}
export class YamlParseError extends Error {}
export class InvalidStageError extends Error {}
export class InvalidAwsAccountError extends Error {}
export class MissingRequiredPositionalArg extends Error {}
export class ExecError extends Error {
  constructor(message: string, public readonly code: number) {
    super(message);
  }
}