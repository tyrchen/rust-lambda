
import * as aws from "@pulumi/aws";
import { createLambdaRole, createLambda, loadCfFunctionCode } from "./utils";
import * as fs from "fs";
import { bucket } from "./shared";

// create lambda role
const apiRole = createLambdaRole("api-lambda-role");

// create lambda role policy
const apiPolicy = new aws.iam.RolePolicy("api-lambda-role-policy", {
  role: apiRole,
  policy: {
    Version: "2012-10-17",
    Statement: [{
      Effect: "Allow",
      Action: [
        "s3:Put*",
        "s3:Get*",
        "s3:List*"
      ],
      Resource: [
        bucket.bucket.apply(name => `arn:aws:s3:::${name}/*`),
      ]
    }, {
      Effect: "Allow",
      Action: [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      Resource: "arn:aws:logs:*:*:*"
    }]
  }
});

// create lambda functions
const apiLambda = createLambda("lambda-api", apiRole, apiPolicy, {});

// create lambda function url
const apiUrl = new aws.lambda.FunctionUrl("lambda-api-url", {
  functionName: apiLambda.arn,
  authorizationType: "NONE",
  cors: {
    allowOrigins: ["*"],
  }
});

// allow function invoke
new aws.lambda.Permission("with-api-public-invoke", {
  action: "lambda:InvokeFunctionUrl",
  function: apiLambda,
  principal: "*",
  functionUrlAuthType: "NONE"
});

export const api = {
  url: apiUrl.functionUrl,
  lambda: apiLambda,
}
