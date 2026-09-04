// Will match `/api/animal` and `/api/animal/:type`
router.endpoint({
    url: "/api/animal/:type?",
    method: ["GET"],
    handler: async ({ text }) => text("Animal!"),
});
