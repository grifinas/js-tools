import * as fs from "fs/promises";
import { load } from "js-yaml";
import { FileNotFoundError, YamlParseError } from "../errors";

export async function loadYamlFile<T extends object>(path: string): Promise<T> {
  let content;
  try {
    content = await fs.readFile(path);
  } catch (e) {
    throw new FileNotFoundError(
      `File ${path} failed to read. File is either not there or missing permissions`,
    );
  }

  try {
    return load(content.toString()) as T;
  } catch (e) {
    throw new YamlParseError(
      `Failed to parse YAML file: ${path}. Is it really the right format?`,
    );
  }
}
