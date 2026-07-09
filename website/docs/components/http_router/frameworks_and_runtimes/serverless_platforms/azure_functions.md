---
sidebar_position: 4
sidebar_label: Azure Functions
pagination_label: Azure Functions
tags:
    - HttpRouter
    - Azure Functions
keywords:
    - HttpRouter
    - Azure Functions
---

# Azure Functions

Use the [Azure Functions Adapter](https://github.com/Marplex/hono-azurefunc-adapter) to run `HttpRouter` on Azure Functions **V4** with Node.js 18+.

### 1. Install the CLI

To create an Azure Function, you must first install [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/create-first-function-cli-typescript?pivots=nodejs-model-v4#install-the-azure-functions-core-tools).

On macOS:

```sh
brew tap azure/functions
brew install azure-functions-core-tools@4
```

### 2. Initialize the project

1. Create the project:

    ```sh
    func init --typescript
    ```

2. Install dependencies:

    ```sh
    npm install @daiso-tech/core hono @marplex/hono-azurefunc-adapter
    ```

3. Change the default route prefix in `host.json`:

    ```json
    {
        "extensions": {
            "http": {
                "routePrefix": ""
            }
        }
    }
    ```

    :::info
    The default Azure Functions route prefix is `/api`. If you don't change it, start all your routes with `/api`.
    :::

### 3. Create the application

```ts
// src/app.ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "@daiso-tech/core/http-router";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/hello",
    method: "GET",
    handler: async () => HttpRes.text("Hello Azure Functions!"),
});

export default router;
```

```ts
// src/functions/httpTrigger.ts
import { app } from "@azure/functions";
import { azureHonoHandler } from "@marplex/hono-azurefunc-adapter";
import honoApp from "../app";

app.http("httpTrigger", {
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    authLevel: "anonymous",
    route: "{*proxy}",
    handler: azureHonoHandler((request: Request) => honoApp.fetch(request)),
});
```

**File structure**

```
.
├── src
│   ├── app.ts
│   └── functions
│       └── httpTrigger.ts
├── package.json
├── host.json
└── tsconfig.json
```

### 4. Develop

```sh
npm run start
```

Access `http://localhost:7071` in your browser.

### 5. Deploy

```sh
npm run build
func azure functionapp publish <YourFunctionAppName>
```

:::info
Before deploying, create the supporting Azure resources. See the [Microsoft documentation](https://learn.microsoft.com/en-us/azure/azure-functions/create-first-function-cli-typescript?pivots=nodejs-model-v4&tabs=windows%2Cazure-cli%2Cbrowser#create-supporting-azure-resources-for-your-function).
:::

**Reference:** [Hono on Azure Functions](https://hono.dev/docs/getting-started/azure-functions)
