import {
  CreateBucketCommand,
  PutBucketPolicyCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getAwsAccount } from "./getAwsAccount";

const s3 = new S3Client();
export async function createBucket(namePrefix: string): Promise<string> {
  const account = getAwsAccount();
  const fromIndex = namePrefix.length > 50 ? namePrefix.length - 50 : 0;
  const bucketName = `${namePrefix
    .toLowerCase()
    .canonical("-")
    .substring(fromIndex)}-${account}`;
  console.log(`Creating bucket: ${bucketName}`);

  await s3.send(
    new CreateBucketCommand({
      Bucket: bucketName,
      ACL: "private",
    }),
  );

  const bucketPolicy = {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "AllowCloudWatchLogsPut",
        Effect: "Allow",
        Principal: {
          Service: "logs.amazonaws.com",
        },
        Action: "s3:*",
        Resource: [
          `arn:aws:s3:::${bucketName}`,
          `arn:aws:s3:::${bucketName}/*`,
        ],
        Condition: {
          StringEquals: {
            "aws:SourceAccount": account,
          },
          ArnLike: {
            "aws:SourceArn": `arn:aws:logs:*:${account}:*`,
          },
        },
      },
    ],
  };

  await s3.send(
    new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(bucketPolicy),
    }),
  );

  return bucketName;
}
