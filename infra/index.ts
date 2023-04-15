import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { api } from "./api";
// import { bucket } from "./shared";
// import * as test from "./test";


const cdnLogs = new aws.s3.BucketV2("lambda-logs", {
  acl: "log-delivery-write",
});

// const oac = new aws.cloudfront.OriginAccessControl("s3oac", {
//   description: "allow s3 access",
//   originAccessControlOriginType: "s3",
//   signingBehavior: "always",
//   signingProtocol: "sigv4",
// });

// const rewriteFn = new aws.cloudfront.Function("rewrite-url", {
//   runtime: "cloudfront-js-1.0",
//   comment: "rewrite path for s3 origin",
//   publish: true,
//   code: loadCfFunctionCode("rewrite.js"),
// });


const cachePolicy = new aws.cloudfront.CachePolicy("cella-cclr-cdn-cache-policy", {
  defaultTtl: 0,
  maxTtl: 86400,
  minTtl: 0,
  parametersInCacheKeyAndForwardedToOrigin: {
    cookiesConfig: {
      cookieBehavior: "whitelist",
      cookies: {
        items: ["id"], // this is just an example of the whitelisted cookie
      },
    },
    headersConfig: {
      headerBehavior: "whitelist",
      headers: {
        items: ["Authorization"],
      }
    },
    queryStringsConfig: {
      queryStringBehavior: "all",
    },
  },
});

const originReqPolicy = new aws.cloudfront.OriginRequestPolicy("lambda-cdn-origin-request-policy", {
  comment: "origin request policy",
  headersConfig: {
    headerBehavior: "whitelist",
    headers: {
      items: ["Origin", "Referer", "Accept", "Accept-Language", "User-Agent", "CloudFront-Viewer-Address", "CloudFront-Viewer-Country", "X-Api-Outage", "Authority"],
    }
  },
  cookiesConfig: {
    cookieBehavior: "all",
  },
  queryStringsConfig: {
    queryStringBehavior: "all",
  }
});

const cfg = new pulumi.Config();
let apiDomain = api.url.apply(url => url.replace("https://", "").replace("/", ""));
const cdn = new aws.cloudfront.Distribution("lambda-cdn", {
  enabled: true,
  aliases: ["*.sigma.city"],
  origins: [{
    originId: "api",
    domainName: apiDomain,
    customOriginConfig: {
      originProtocolPolicy: "https-only",
      httpPort: 80,
      httpsPort: 443,
      originSslProtocols: ["TLSv1.2"],
    },
    customHeaders: [{
      name: cfg.require("cf-lambda-header"),
      value: cfg.require("cf-lambda-secret"),
    }],
  }],

  defaultCacheBehavior: {
    targetOriginId: "api",
    compress: true,
    viewerProtocolPolicy: "redirect-to-https",
    allowedMethods: [
      "GET",
      "HEAD",
      "OPTIONS",
    ],
    cachedMethods: [
      "GET",
      "HEAD",
      "OPTIONS",
    ],
    cachePolicyId: cachePolicy.id,
    originRequestPolicyId: originReqPolicy.id,
  },

  loggingConfig: {
    bucket: cdnLogs.bucketDomainName,
    includeCookies: true,
    prefix: "lambda-cdn/",
  },

  priceClass: "PriceClass_100",
  customErrorResponses: [{
    errorCode: 404,
    responseCode: 404,
    responsePagePath: `/error.html`,
  }],
  restrictions: {
    geoRestriction: {
      restrictionType: "none",
    },
  },
  viewerCertificate: {
    cloudfrontDefaultCertificate: false,
    acmCertificateArn: cfg.require("cf-cert-arn"),
    sslSupportMethod: "sni-only",
    minimumProtocolVersion: "TLSv1.2_2021",

  },
  httpVersion: "http2and3",
});

// Exports
// export const bucketName = bucket.id;
export const cndLogName = cdnLogs.id;
export const cdnDomainName = cdn.domainName;
export const lambdaApiUrl = api.url;

// export test assets
// export const testBucketName = test.testBucket.id;
// export const testUser = test.testUser;
