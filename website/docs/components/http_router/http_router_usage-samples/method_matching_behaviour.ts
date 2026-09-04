router.endpoint({
    url: "/get-only",
    method: ["GET"],
    handler: async ({ text }) => text("Only GET"),
});

// POST /get-only → 404 Not Found
// GET /get-only  → 200 "Only GET"
