router.endpoint({
    url: "/resource",
    method: ["GET"],
    handler: async ({ text }) => text("GET /resource"),
});

router.endpoint({
    url: "/resource",
    method: ["POST"],
    handler: async ({ text }) => text("POST /resource"),
});

router.endpoint({
    url: "/resource",
    method: ["PUT"],
    handler: async ({ text }) => text("PUT /resource"),
});

router.endpoint({
    url: "/resource",
    method: ["DELETE"],
    handler: async ({ text }) => text("DELETE /resource"),
});
