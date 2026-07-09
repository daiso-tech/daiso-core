---
sidebar_position: 1
sidebar_label: Intro
pagination_label: Intro
tags:
    - HttpRouter
keywords:
    - HttpRouter
---

# Intro

`HttpRouter` implements the WinterTC fetch standard, exposing a `fetch(request: Request): Response | Promise<Response>` method. This makes it compatible with any framework, runtime, or platform adapter that accepts a standard fetch handler.

## Frameworks

- [Next.js App Router](./frameworks_and_runtimes/frameworks/nextjs_app_router)
- [Next.js Pages Router](./frameworks_and_runtimes/frameworks/nextjs_pages_router)
- [Nuxt](./frameworks_and_runtimes/frameworks/nuxt)
- [Analog.js](./frameworks_and_runtimes/frameworks/analogjs)
- [SvelteKit](./frameworks_and_runtimes/frameworks/sveltekit)
- [SolidStart](./frameworks_and_runtimes/frameworks/solidstart)
- [TanStack Start](./frameworks_and_runtimes/frameworks/tanstack_start)

## JavaScript Runtimes

- [Deno](./frameworks_and_runtimes/javascript_runtimes/deno)
- [Bun](./frameworks_and_runtimes/javascript_runtimes/bun)
- [Node.js](./frameworks_and_runtimes/javascript_runtimes/nodejs)

## Edge Platforms

- [Cloudflare Workers](./frameworks_and_runtimes/edge_platforms/cloudflare_workers)
- [Fastly Compute](./frameworks_and_runtimes/edge_platforms/fastly_compute)
- [Vercel](./frameworks_and_runtimes/edge_platforms/vercel)
- [Netlify](./frameworks_and_runtimes/edge_platforms/netlify)

## Serverless Platforms

- [Supabase Functions](./frameworks_and_runtimes/serverless_platforms/supabase_functions)
- [AWS Lambda](./frameworks_and_runtimes/serverless_platforms/aws_lambda)
- [AWS Lambda@Edge](./frameworks_and_runtimes/serverless_platforms/aws_lambda_edge)
- [Azure Functions](./frameworks_and_runtimes/serverless_platforms/azure_functions)
- [Google Cloud Run](./frameworks_and_runtimes/serverless_platforms/google_cloud_run)
- [Alibaba Cloud Function Compute](./frameworks_and_runtimes/serverless_platforms/alibaba_cloud_function_compute)

---

## Further information

- [Hono documentation](https://hono.dev/docs/) — Primary reference for runtime adapters and integration patterns.
- [`HttpRouter` API docs](https://daiso-tech.github.io/daiso-core/classes/HttpRouter.HttpRouter.html)
- [WinterTC fetch standard](https://wintertc.org/work)
