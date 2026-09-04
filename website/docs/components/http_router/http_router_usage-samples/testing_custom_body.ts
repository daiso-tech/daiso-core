import {
    HttpRouter,
    defaultHttpRouterAdapter,
    HttpReq,
} from "eridu-tech/http-router";
import { describe, expect, test } from "vitest";

describe("Custom body", () => {
    test("should send raw data", async () => {
        const router = new HttpRouter({ router: defaultHttpRouterAdapter });

        router.endpoint({
            url: "/raw",
            method: ["POST"],
            handler: async ({ req, text }) => text(await req.text()),
        });

        const httpReq = HttpReq.test({
            method: "POST",
            url: "/raw",
            body: {
                type: "custom",
                data: new Blob(["raw data"]),
            },
        });

        const response = await router.fetch(httpReq.webReq);
        expect(response.status).toBe(200);
    });
});
