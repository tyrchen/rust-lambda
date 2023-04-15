
import * as aws from "@pulumi/aws";

// Create a bucket
export const bucket = new aws.s3.BucketV2("lambda", {
  lifecycleRules: [{
    id: "lambda-data-lifecycle",
    expirations: [{
      days: 3,
    }],
    enabled: true,
    abortIncompleteMultipartUploadDays: 1,
  }]
});
