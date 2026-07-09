---
sidebar_position: 2
sidebar_label: AWS Lambda
pagination_label: AWS Lambda
tags:
    - HttpRouter
    - AWS Lambda
keywords:
    - HttpRouter
    - AWS Lambda
---

# AWS Lambda

Use the `hono/aws-lambda` adapter to wrap `HttpRouter` for AWS Lambda.

### 1. Install

```sh
npm install @daiso-tech/core hono
npm install -D esbuild
```

### 2. Create the handler

```ts
// lambda/index.ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "@daiso-tech/core/http-router";
import { handle } from "hono/aws-lambda";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/hello",
    method: "GET",
    handler: async () => HttpRes.text("Hello AWS Lambda!"),
});

export const handler = handle(router);
```

**File structure**

```
.
├── lambda
│   └── index.ts
├── lib
│   └── my-app-stack.ts
├── package.json
└── cdk.json
```

### 3. Set up CDK deployment

```ts
// lib/my-app-stack.ts
import * as cdk from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";

export class MyAppStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        const fn = new NodejsFunction(this, "lambda", {
            entry: "lambda/index.ts",
            handler: "handler",
            runtime: Runtime.NODEJS_22_X,
        });
        const fnUrl = fn.addFunctionUrl({
            authType: cdk.aws_lambda.FunctionUrlAuthType.NONE,
        });
        new cdk.CfnOutput(this, "lambdaUrl", {
            value: fnUrl.url!,
        });
    }
}
```

### 4. Deploy

```sh
cdk deploy
```

**Reference:** [Hono on AWS Lambda](https://hono.dev/docs/getting-started/aws-lambda)
