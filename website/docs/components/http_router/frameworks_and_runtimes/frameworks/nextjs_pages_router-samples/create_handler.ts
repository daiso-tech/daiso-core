// pages/api/[[...route]].ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "eridu-tech/http-router";
import { getRequestListener } from "@hono/node-server";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/api/hello",
    method: "GET",
    handler: async () => HttpRes.text("Hello from Next.js!"),
});

export default getRequestListener((request: Request) => router.fetch(request));
