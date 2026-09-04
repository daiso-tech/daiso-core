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
npm install eridu-tech hono
mkdir lambda
```

### 2. Create the handler

```ts file=./aws_lambda_edge-samples/create_handler.ts
```

### 3. Set up CDK deployment

```ts file=./aws_lambda_edge-samples/cdk_app.ts
```

```ts file=./aws_lambda_edge-samples/cdk_stack.ts
```

### 4. Deploy

```sh
cdk deploy
```

**Limitations:** Lambda@Edge has a 1MB response body limit and runs in a single AWS region per distribution.

**Reference:** [Hono on Lambda@Edge](https://hono.dev/docs/getting-started/lambda-edge)
