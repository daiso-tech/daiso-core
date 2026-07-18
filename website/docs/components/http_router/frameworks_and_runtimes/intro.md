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

- [Next.js App Router](./frameworks/nextjs_app_router)
- [Next.js Pages Router](./frameworks/nextjs_pages_router)
- [Nuxt](./frameworks/nuxt)
- [Analog.js](./frameworks/analogjs)
- [SvelteKit](./frameworks/sveltekit)
- [SolidStart](./frameworks/solidstart)
- [TanStack Start](./frameworks/tanstack_start)

## JavaScript Runtimes

- [Deno](./javascript_runtimes/deno)
- [Bun](./javascript_runtimes/bun)
- [Node.js](./javascript_runtimes/nodejs)

## Edge Platforms

- [Cloudflare Workers](./edge_platforms/cloudflare_workers)
- [Fastly Compute](./edge_platforms/fastly_compute)
- [Vercel](./edge_platforms/vercel)
- [Netlify](./edge_platforms/netlify)

## Serverless Platforms

- [Supabase Functions](./serverless_platforms/supabase_functions)
- [AWS Lambda](./serverless_platforms/aws_lambda)
- [AWS Lambda@Edge](./serverless_platforms/aws_lambda_edge)
- [Azure Functions](./serverless_platforms/azure_functions)
- [Google Cloud Run](./serverless_platforms/google_cloud_run)
- [Alibaba Cloud Function Compute](./serverless_platforms/alibaba_cloud_function_compute)

---

## Further information

- [Hono documentation](https://hono.dev/docs/) — Primary reference for runtime adapters and integration patterns.
- [`HttpRouter` API docs](https://daiso-tech.github.io/daiso-core/classes/HttpRouter.HttpRouter.html)
- [WinterTC fetch standard](https://wintertc.org/work)
