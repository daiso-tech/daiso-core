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
npm install eridu-tech hono
npm install -D esbuild
```

### 2. Create the handler

```ts file=./aws_lambda-samples/create_handler.ts
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

```ts file=./aws_lambda-samples/cdk_deployment.ts
```

### 4. Deploy

```sh
cdk deploy
```

**Reference:** [Hono on AWS Lambda](https://hono.dev/docs/getting-started/aws-lambda)
