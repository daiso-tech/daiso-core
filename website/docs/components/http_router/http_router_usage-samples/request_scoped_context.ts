const REQ_ID = contextToken<string>("REQ_ID");
const CURRENT_DATE = contextToken<string>("CURRENT_DATE");

router.use(async ({ context, next }) => {
    context.put(REQ_ID, crypto.randomUUID());
    context.put(CURRENT_DATE, Date.now());
    return await next();
});

router.endpoint({
    url: "/track",
    method: ["GET"],
    handler: async ({ context, text }) => {
        const requestId = context.getOrFail(REQ_ID);
        const startTime = context.getOrFail(CURRENT_DATE);
        return text(`Request ${String(requestId)} processed`);
    },
});
