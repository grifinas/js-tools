import { Lambda } from "@aws-sdk/client-lambda";
import { adaAuth } from "./adaAuth";

const lambda = new Lambda();
export async function getLambdaNames(): Promise<string[]> {
  await adaAuth();

  const lambdas = await lambda.listFunctions({});
  if (!lambdas.Functions) {
    throw new Error("Failed to get functions");
  }
  return lambdas.Functions.map((f) => f.FunctionName).filter(
    Boolean,
  ) as string[];
}
