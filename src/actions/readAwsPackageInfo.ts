import { recursiveStatFile } from "../utils/fs/recursive-stat-file";
import fs from "fs/promises";

/*
* base = {
  workspace = kdomanta_silencio;
  versionSet = "ACS-Silencio/development";
  dependencyModel = brazil;
};
packages = {
  ACS-SilencioCDK-1.0 = .;
  ACSSilencioWebsite-1.0 = .;
  ACSSilencioEmailLambda-1.0 = .;
  ACSSilencioDeviceStatusServiceLambda-1.0 = .;
  ACSSilencioLambda-1.0 = .;
  ACSCustomAlarmDefinitionsLambda-1.0 = .;
  ACSSilencioTests-1.0 = .;
};
platformOverride = AL2_x86_64;

* */

const anyWord = "([a-zA-Z]+)";
const equals = "\\s*=\\s*";
const bracketContent = "\\{([^}]+)\\}";

export async function readAwsPackageInfo(): Promise<Record<string, unknown>> {
  const stat = await recursiveStatFile("./packageInfo");
  const buffer = await fs.readFile(stat.path);
  let content = buffer.toString("utf-8");

  const result: Record<string, unknown> = {};
  let part;
  do {
    part = readPart(content);
    if (!part) {
      break;
    }
    const { matched, key, value } = part;
    content = content.replace(matched, "");
    result[key] = value;
  } while (part);

  return result;
}

function readPart(
  content: string,
): { matched: string; key: string; value: unknown } | null {
  const result = content.match(
    new RegExp(`${anyWord}${equals}${bracketContent}`),
  );

  if (!result) {
    return null;
  }

  const [matched, key, unparsedValue] = result;

  const keyValueParis = unparsedValue.replace(/\s+/g, " ").split(";");

  const value = keyValueParis.reduce(
    (acc, pair) => {
      if (pair.trim() === "") {
        return acc;
      }

      const [k, v] = pair.split("=");
      acc[k.trim()] = v.trim().replace(/"/g, "");
      return acc;
    },
    {} as Record<string, string>,
  );

  return { matched, key, value };
}
