router.endpoint({
    url: "/cache",
    method: ["PURGE"],
    handler: async ({ text }) => text("PURGE Method /cache"),
});
