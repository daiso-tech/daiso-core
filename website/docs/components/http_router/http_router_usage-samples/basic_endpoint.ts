import { HttpRouter } from "eridu-tech/http-router";

const router = new HttpRouter({
    router: defaultHttpRouterAdapter,
});

router.endpoint({
    url: "/hello",
    method: ["GET"],
    handler: async ({ text }) => {
        return text("Hello World");
    },
});
