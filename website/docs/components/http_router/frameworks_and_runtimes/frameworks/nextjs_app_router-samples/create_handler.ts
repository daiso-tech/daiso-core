// app/api/[[...route]]/route.ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "eridu-tech/http-router";
import { handle } from "hono/vercel";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/api/hello",
    method: "GET",
    handler: async () => HttpRes.text("Hello from Next.js!"),
});

export const GET = handle(router);
export const HEAD = handle(router);
export const POST = handle(router);
export const PUT = handle(router);
export const DELETE = handle(router);
export const PATCH = handle(router);
export const OPTIONS = handle(router);
