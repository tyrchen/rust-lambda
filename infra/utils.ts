
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";

export function createLambdaRole(name: string) {
  return new aws.iam.Role(name, {
    assumeRolePolicy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
        Action: "sts:AssumeRole",
        Principal: {
          Service: "lambda.amazonaws.com",
        },
        Effect: "Allow",
        Sid: "",

      }],
    })
  });
}

export function createLambda(asset_name: string, role: aws.iam.Role, policy: aws.iam.RolePolicy, variables: any) {
  return new aws.lambda.Function(asset_name, {
    code: new pulumi.asset.FileArchive(`lambda/${asset_name}.zip`),
    handler: "bootstrap",
    runtime: aws.lambda.Runtime.CustomAL2,
    memorySize: 128,
    architectures: ["arm64"],
    role: role.arn,
    tracingConfig: {
      mode: "Active",
    },
    environment: {
      variables,
    }
  }, {
    dependsOn: [policy]
  });
}

export function loadCfFunctionCode(name: string) {
  let content = fs.readFileSync(`functions/${name}`, "utf8");
  return content;
}
