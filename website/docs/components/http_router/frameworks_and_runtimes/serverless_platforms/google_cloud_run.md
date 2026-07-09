---
sidebar_position: 5
sidebar_label: Google Cloud Run
pagination_label: Google Cloud Run
tags:
    - HttpRouter
    - Google Cloud Run
keywords:
    - HttpRouter
    - Google Cloud Run
---

# Google Cloud Run

Google Cloud Run runs containerized workloads. This guide assumes you have a Google Cloud account with billing enabled.

### 1. Install the CLI

Install the [gcloud CLI](https://cloud.google.com/sdk/docs/install):

For example, on MacOS using Homebrew:

```sh
brew install --cask gcloud-cli
```

Authenticate with the CLI:

```sh
gcloud auth login
```

### 2. Set up the project

1. Create a project. Accept the auto-generated project ID at the prompt:

    ```sh
    gcloud projects create --set-as-default --name="my app"
    ```

2. Create environment variables for your project ID and project number for easy reuse. It may take ~30 seconds before the project successfully returns with the `gcloud projects list` command:

    ```sh
    PROJECT_ID=$(gcloud projects list \
        --format='value(projectId)' \
        --filter='name="my app"')

    PROJECT_NUMBER=$(gcloud projects list \
        --format='value(projectNumber)' \
        --filter='name="my app"')

    echo $PROJECT_ID $PROJECT_NUMBER
    ```

3. Find your billing account ID:

    ```sh
    gcloud billing accounts list
    ```

4. Add your billing account from the prior command to the project:

    ```sh
    gcloud billing projects link $PROJECT_ID \
        --billing-account=[billing_account_id]
    ```

5. Enable the required APIs:

    ```sh
    gcloud services enable run.googleapis.com \
        cloudbuild.googleapis.com
    ```

6. Update the service account permissions to have access to Cloud Build:

    ```sh
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member=serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com \
        --role=roles/run.builder
    ```

### 3. Install dependencies

```sh
npm install @daiso-tech/core hono @hono/node-server
```

### 4. Create the application

```ts
// src/index.ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "@daiso-tech/core/http-router";
import { serve } from "@hono/node-server";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/hello",
    method: "GET",
    handler: async () => HttpRes.text("Hello Google Cloud Run!"),
});

serve({ fetch: (request: Request) => router.fetch(request), port: 8080 });
```

:::info
Google Cloud Run expects the server to listen on port `8080`.
:::

**File structure**

```
.
├── src
│   └── index.ts
├── package.json
├── tsconfig.json
└── Dockerfile
```

**`Dockerfile`**

```Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build && npm prune --production

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
EXPOSE 8080
CMD ["node", "dist/index.js"]
```

### 5. Develop

```sh
npm run dev
```

Access `http://localhost:8080` in your browser.

### 6. Deploy

```sh
gcloud run deploy my-app --source . --allow-unauthenticated
```

**Reference:** [Hono on Google Cloud Run](https://hono.dev/docs/getting-started/google-cloud-run)
