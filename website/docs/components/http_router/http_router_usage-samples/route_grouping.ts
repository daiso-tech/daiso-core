router.group("/api", (api) => {
    api.endpoint({
        url: "/users",
        method: ["GET"],
        handler: async ({ json }) => json({ users: [] }),
    });

    api.endpoint({
        url: "/users/:id",
        method: ["GET"],
        handler: async ({ req, json }) => {
            const { id } = req.params();
            return json({ userId: id });
        },
    });
});
