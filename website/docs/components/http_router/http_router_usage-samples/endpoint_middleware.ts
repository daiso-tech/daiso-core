router.endpoint({
    url: "/admin",
    method: ["GET"],
    handler: async ({ text }) => text("Admin panel"),
    middlewares: (builder) =>
        builder.use(async ({ req, res, next }) => {
            const authHeader = req.headers()["authorization"];
            if (!authHeader) {
                return res.setStatus(401).setBody("Unauthorized");
            }
            return await next();
        }),
});
