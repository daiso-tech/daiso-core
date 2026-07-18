---
sidebar_position: 3
sidebar_label: AWS Lambda@Edge
pagination_label: AWS Lambda@Edge
tags:
    - HttpRouter
    - AWS Lambda@Edge
keywords:
    - HttpRouter
    - AWS Lambda@Edge
---

# AWS Lambda@Edge

Use the `hono/lambda-edge` adapter to run `HttpRouter` on Lambda@Edge with CloudFront.

### 1. Set up the project

```sh
mkdir my-app
cd my-app
cdk init app -l typescript
npm install @daiso-tech/core hono
mkdir lambda
```

### 2. Create the handler

```ts
// lambda/index_edge.ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "@daiso-tech/core/http-router";
import { handle } from "hono/lambda-edge";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/hello",
    method: "GET",
    handler: async () => HttpRes.text("Hello Lambda@Edge!"),
});

export const handler = handle(router);
```

### 3. Set up CDK deployment

```ts
// bin/my-app.ts
#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { MyAppStack } from "../lib/my-app-stack";

const app = new cdk.App();
new MyAppStack(app, "MyAppStack", {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: "us-east-1",
    },
});
```

```ts
// lib/my-app-stack.ts
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";

export class MyAppStack extends cdk.Stack {
    public readonly edgeFn: lambda.Function;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        const edgeFn = new NodejsFunction(this, "edgeViewer", {
            entry: "lambda/index_edge.ts",
            handler: "handler",
            runtime: lambda.Runtime.NODEJS_22_X,
        });

        const originBucket = new s3.Bucket(this, "originBucket");

        new cloudfront.Distribution(this, "Cdn", {
            defaultBehavior: {
                origin: new origins.S3Origin(originBucket),
                edgeLambdas: [
                    {
                        functionVersion: edgeFn.currentVersion,
                        eventType:
                            cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
                    },
                ],
            },
        });
    }
}
```

### 4. Deploy

```sh
cdk deploy
```

**Limitations:** Lambda@Edge has a 1MB response body limit and runs in a single AWS region per distribution.

**Reference:** [Hono on Lambda@Edge](https://hono.dev/docs/getting-started/lambda-edge)
