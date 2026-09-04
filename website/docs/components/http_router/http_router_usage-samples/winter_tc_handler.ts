import { HttpRouter } from "eridu-tech/http-router";

// A standard Winter TC handler
async function healthHandler(request: Request): Promise<Response> {
    if (request.method.toLowerCase() !== "get") {
        return new Response("Not found", { status: 404 });
    }
    const url = new URL(request.url);
    if (url.pathname === "/proxy/health") {
        return new Response("OK", { status: 200 });
    }
    return fetch(request);
}

// Adapted to work with HttpRouter endpoint via the static method
router.endpoint({
    url: "/proxy/*",
    handler: HttpRouter.fromWinterTcHandler(healthHandler),
});
