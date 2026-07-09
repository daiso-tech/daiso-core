---
sidebar_position: 6
sidebar_label: Alibaba Cloud Function Compute
pagination_label: Alibaba Cloud Function Compute
tags:
    - HttpRouter
    - Alibaba Cloud Function Compute
keywords:
    - HttpRouter
    - Alibaba Cloud Function Compute
---

# Alibaba Cloud Function Compute

This guide uses the third-party adapter [rwv/hono-alibaba-cloud-fc3-adapter](https://github.com/rwv/hono-alibaba-cloud-fc3-adapter) to run `HttpRouter` on Alibaba Cloud Function Compute.

### 1. Set up the project

```sh
mkdir my-app
cd my-app
npm install @daiso-tech/core hono hono-alibaba-cloud-fc3-adapter
npm install -D @serverless-devs/s esbuild
mkdir src
```

### 2. Create the handler

```ts
// src/index.ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "@daiso-tech/core/http-router";
import { handle } from "hono-alibaba-cloud-fc3-adapter";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/hello",
    method: "GET",
    handler: async () => HttpRes.text("Hello Alibaba Cloud!"),
});

export const handler = handle(router);
```

### 3. Configure serverless-devs

[serverless-devs](https://github.com/Serverless-Devs/Serverless-Devs) is an open source and open serverless developer platform dedicated to providing developers with a powerful tool chain system. Through this platform, developers can not only experience multi cloud serverless products with one click and rapidly deploy serverless projects, but also manage projects in the whole life cycle of serverless applications, and combine serverless devs with other tools / platforms very simply and quickly to further improve the efficiency of R & D, operation and maintenance.

1. Add your Alibaba Cloud credentials:

    ```sh
    npx s config add
    # Please select a provider: Alibaba Cloud (alibaba)
    # Input your AccessKeyID & AccessKeySecret
    ```

2. Edit `s.yaml`:

    ```yaml
    edition: 3.0.0
    name: my-app
    access: "default"

    vars:
        region: "us-west-1"

    resources:
        my-app:
            component: fc3
            props:
                region: ${vars.region}
                functionName: "my-app"
                description: "Hello World by Hono"
                runtime: "nodejs20"
                code: ./dist
                handler: index.handler
                memorySize: 1024
                timeout: 300
    ```

3. Edit `scripts` in `package.json`:

    ```json
    {
        "scripts": {
            "build": "esbuild --bundle --outfile=./dist/index.js --platform=node --target=node20 ./src/index.ts",
            "deploy": "s deploy -y"
        }
    }
    ```

**File structure**

```
.
├── src
│   └── index.ts
├── package.json
├── tsconfig.json
└── s.yaml
```

### 4. Deploy

```sh
npm run build  # Compile TypeScript to JavaScript
npm run deploy # Deploy to Alibaba Cloud Function Compute
```

**Reference:** [Hono on Alibaba Cloud Function Compute](https://hono.dev/docs/getting-started/ali-function-compute)
