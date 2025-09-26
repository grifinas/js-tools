import { inferOption } from "./inferOption";
import { userChoice } from "./user-choice";

export async function inferOptionOrAsk(
  input: string,
  givenOptions: string[],
): Promise<string | null> {
  const { result, narrowedOptions } = inferOption(input, givenOptions);
  if (result) return result;
  if (narrowedOptions.length) {
    return await userChoice(narrowedOptions);
  }

  return null;
}
