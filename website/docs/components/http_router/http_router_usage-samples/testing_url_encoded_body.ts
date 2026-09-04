import {
    HttpRouter,
    defaultHttpRouterAdapter,
    HttpReq,
} from "eridu-tech/http-router";
import { describe, expect, test } from "vitest";

describe("URL-encoded body", () => {
    test("should send form data", async () => {
        const router = new HttpRouter({ router: defaultHttpRouterAdapter });

        router.endpoint({
            url: "/submit",
            method: ["POST"],
            handler: async ({ req, text }) =>
                text(String(await req.formData())),
        });

        const httpReq = HttpReq.test({
            method: "POST",
            url: "/submit",
            body: {
                type: "application/x-www-form-urlencoded",
                data: { username: "john", role: "admin" },
            },
        });

        const response = await router.fetch(httpReq.webReq);
        expect(response.status).toBe(200);
    });
});
