// supabase/functions/hello-world/index.ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "npm:eridu-tech/http-router";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/hello-world/hello",
    method: "GET",
    handler: async () => HttpRes.text("Hello Supabase!"),
});

Deno.serve((request: Request) => router.fetch(request));
