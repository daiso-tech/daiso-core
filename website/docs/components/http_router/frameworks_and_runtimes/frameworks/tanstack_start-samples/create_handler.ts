// app/routes/api/$.ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "eridu-tech/http-router";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/api/hello",
    method: "GET",
    handler: async () => HttpRes.text("Hello from TanStack Start!"),
});

export const Route = createFileRoute("/api/$")({
    server: {
        handlers: {
            GET: async ({ request }) => {
                return router.fetch(request);
            },
            HEAD: async ({ request }) => {
                return router.fetch(request);
            },
            PUT: async ({ request }) => {
                return router.fetch(request);
            },
            DELETE: async ({ request }) => {
                return router.fetch(request);
            },
            PATCH: async ({ request }) => {
                return router.fetch(request);
            },
            OPTIONS: async ({ request }) => {
                return router.fetch(request);
            },
        },
    },
});
