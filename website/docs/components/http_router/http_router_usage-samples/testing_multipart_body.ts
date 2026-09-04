import {
    HttpRouter,
    defaultHttpRouterAdapter,
    HttpReq,
} from "eridu-tech/http-router";
import { describe, expect, test } from "vitest";

describe("Multipart body", () => {
    test("should send multipart form with file uploads", async () => {
        const router = new HttpRouter({ router: defaultHttpRouterAdapter });

        router.endpoint({
            url: "/upload",
            method: ["POST"],
            handler: async ({ req, json }) => {
                const formData = await req.formData();
                const file = formData["avatar"];
                const content =
                    file && typeof file !== "string"
                        ? await file.asText()
                        : null;
                return json({ uploaded: !!content });
            },
        });

        const httpReq = HttpReq.test({
            method: "POST",
            url: "/upload",
            body: {
                type: "multipart/form-data",
                data: {
                    fields: { description: "my file" },
                    files: {
                        avatar: new TextEncoder().encode("file content").buffer,
                    },
                },
            },
        });

        const response = await router.fetch(httpReq.webReq);
        expect(response.status).toBe(200);
    });
});
