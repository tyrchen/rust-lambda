import * as aws from "@pulumi/aws";

// Create an S3 bucket for apps
export const testBucket = new aws.s3.BucketV2("lambda-test", {
  bucket: "lambda-data-test",
  lifecycleRules: [{
    id: "lambda-test-lifecycle",
    expirations: [{
      days: 1,
    }],
    enabled: true,
    abortIncompleteMultipartUploadDays: 1,
  }]
});

// create a user for test purposes
export const testUser = new aws.iam.User("lambda-test-user", {
  name: "lambda-test-user",
  path: "/",
}, {
  protect: false
});

// allow s3 access for test user
export const testUserPolicy = new aws.iam.UserPolicy("lambda-test-user-policy", {
  user: testUser.name,
  policy: {
    Version: "2012-10-17",
    Statement: [{
      Effect: "Allow",
      Action: [
        "s3:*",
      ],
      Resource: [
        testBucket.bucket.apply(name => `arn:aws:s3:::${name}/*`),
      ]
    }]
  }
});
