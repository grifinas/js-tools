import { getStage } from "../utils/stage";
import { cliInfo } from "../utils/logger";

interface InferredResult {
  result: string | null;
  narrowedOptions: string[];
}

export function inferOption(
  input: string,
  givenOptions: string[],
  iteration = 1,
): InferredResult {
  const lowercaseInput = input.toLowerCase();
  let narrowedOptions: string[] = [];
  switch (iteration) {
    case 1:
      narrowedOptions = givenOptions.filter((s) =>
        s.toLowerCase().includes(lowercaseInput),
      );
      break;
    case 2:
      narrowedOptions = givenOptions.filter((s) => s.includes(getStage()));
      break;
  }

  const exactMatch = narrowedOptions.find((m) => m === lowercaseInput);
  if (exactMatch) {
    cliInfo(`Found exact match: ${exactMatch}`);
    return {
      result: exactMatch,
      narrowedOptions,
    };
  }

  switch (narrowedOptions.length) {
    case 0:
      return {
        result: null,
        narrowedOptions:
          narrowedOptions.length > 0 ? narrowedOptions : givenOptions,
      };
    case 1:
      return {
        result: narrowedOptions[0],
        narrowedOptions:
          narrowedOptions.length > 0 ? narrowedOptions : givenOptions,
      };
    default:
      cliInfo("Matching options for", input, "--", narrowedOptions);
      return inferOption(input, narrowedOptions, iteration + 1);
  }
}
