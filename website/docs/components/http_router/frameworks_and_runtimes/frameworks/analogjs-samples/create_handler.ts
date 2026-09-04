// src/server/routes/api/[...].ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "eridu-tech/http-router";
import { defineEventHandler, toWebRequest } from "h3";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/api/hello",
    method: "GET",
    handler: async () => HttpRes.text("Hello from Analog!"),
});

export default defineEventHandler(async (event) => {
    const request = toWebRequest(event);
    return router.fetch(request);
});
