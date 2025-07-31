import { Lambda } from "@aws-sdk/client-lambda";
import { fromIni } from "@aws-sdk/credential-providers";
import { getAwsAccount } from "./getAwsAccount";
import { adaAuth } from "./adaAuth";
import { InvokeCommandOutput } from "@aws-sdk/client-lambda/dist-types/commands/InvokeCommand";

export type InvokeLambdaFunction = (
  payload: object,
) => Promise<InvokeCommandOutput>;

export async function getLambdaInvoker(
  fname: string,
  account: string = getAwsAccount(),
): Promise<InvokeLambdaFunction> {
  await adaAuth(account);
  const lambdaClient = new Lambda({
    credentials: fromIni({ profile: "default" }),
  });

  return async function invokeLambda(payload: object) {
    return await lambdaClient.invoke({
      FunctionName: fname,
      Payload: JSON.stringify(payload),
      InvocationType: "RequestResponse",
    });
  };
}
