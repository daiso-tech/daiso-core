import { HttpReq } from "eridu-tech/http-router";

const httpReq = HttpReq.test({
    method: "POST",
    url: "/api/data",
    params: { id: "42" },
    searchParams: { include: "profile" },
    headers: { authorization: "Bearer token" },
    cookies: { session: "abc123" },
    body: {
        type: "application/json",
        data: { name: "John" },
    },
});
