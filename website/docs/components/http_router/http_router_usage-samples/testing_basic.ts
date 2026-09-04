import { HttpReq } from "eridu-tech/http-router";
import { describe, expect, test } from "vitest";

describe("My router", () => {
    test("should respond to GET /hello", async () => {
        const router = new HttpRouter({
            router: defaultHttpRouterAdapter,
        });

        router.endpoint({
            url: "/hello",
            method: ["GET"],
            handler: async ({ text }) => text("Hello World"),
        });

        const request = new Request("https://test.local/hello");
        const response = await router.fetch(request);
        expect(response.status).toBe(200);
        expect(await response.text()).toBe("Hello World");
    });
});
