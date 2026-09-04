// src/index.ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "eridu-tech/http-router";
import { fire } from "@fastly/hono-fastly-compute";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/hello",
    method: "GET",
    handler: async () => HttpRes.text("Hello Fastly Compute!"),
});

fire(router);
