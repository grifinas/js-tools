import * as map from "../accounts.json";
import process from "process";
import { getStage } from "../utils/stage";

export function getAwsAccount(stage?: string) {
  const dir = process.cwd();
  const selectedStage = stage || getStage();

  const tool = Object.keys(map).find((tool) =>
    dir.includes(tool),
  ) as unknown as keyof typeof map | undefined;

  if (tool) {
    const stages = map[tool];

    if (selectedStage in stages) {
      return stages[selectedStage as keyof typeof stages];
    }
  }

  throw new Error(
    `Unknown account number for ${selectedStage} in dir: ${dir}. Maybe you're in the wrong directory?`,
  );
}
