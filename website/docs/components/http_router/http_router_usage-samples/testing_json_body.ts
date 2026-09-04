import {
    HttpRouter,
    defaultHttpRouterAdapter,
    HttpReq,
} from "eridu-tech/http-router";
import { describe, expect, test } from "vitest";

describe("JSON body", () => {
    test("should send JSON data", async () => {
        const router = new HttpRouter({ router: defaultHttpRouterAdapter });

        router.endpoint({
            url: "/users/:id",
            method: ["POST"],
            handler: async ({ req, json }) =>
                json({
                    params: req.params(),
                    body: await req.json(),
                }),
        });

        const httpReq = HttpReq.test({
            method: "POST",
            url: "/users/:id",
            hostname: "https://api.example.com",
            params: { id: "42" },
            searchParams: { include: "profile", tags: ["a", "b"] },
            headers: { authorization: "Bearer token" },
            cookies: { session: "abc123" },
            body: {
                type: "application/json",
                data: { name: "John" },
            },
        });

        const response = await router.fetch(httpReq.webReq);
        expect(response.status).toBe(200);
    });
});
