router.endpoint({
    url: "/post",
    method: ["PUT", "DELETE"],
    handler: async ({ req, text }) => {
        return text(`${req.method} /post`);
    },
});
