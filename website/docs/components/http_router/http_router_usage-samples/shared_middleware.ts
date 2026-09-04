router.use(async ({ req, next }) => {
    const start = Date.now();
    const response = await next();
    const duration = Date.now() - start;
    response.setHeader("X-Response-Time", String(duration));
    return response;
});

router.endpoint({
    url: "/api/data",
    method: ["GET"],
    handler: async ({ json }) => json({ data: "test" }),
});
