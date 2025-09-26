import { createInterface } from "node:readline";
import { inferOption } from "./inferOption";
import { cliError } from "../utils/logger";

export function userChoice(options: string[]): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const optionString = options
    .map((option, index) => `${index + 1}. ${option}`)
    .join("\n");

  return new Promise((resolve) => {
    console.log(
      `Chose one of the options available below by typing the number or option itself\n${optionString}`,
    );
    rl.prompt();
    rl.on("line", async (answer: string) => {
      const num = Number(answer);
      if (isNaN(num)) {
        const { result } = inferOption(answer, options);
        if (result) {
          rl.close();
          resolve(result);
          return;
        } else {
          cliError(`Unknown answer, Please try again`);
          rl.prompt();
          return;
        }
      } else if (options[num - 1]) {
        rl.close();
        resolve(options[num - 1]);
        return;
      } else {
        cliError(`Unknown answer, Please try again.`);
        rl.prompt();
        return;
      }
    });
  });
}
