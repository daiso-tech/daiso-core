router.endpoint({
    url: "/data",
    method: ["POST"],
    handler: async ({ req }) => {
        // JSON body
        const json = await req.json();

        // Form fields (text only)
        const fields = await req.fields();

        // Uploaded files
        const files = await req.files();

        // Raw form data (fields and files)
        const formData = await req.formData();

        // Path parameters
        const params = req.params();

        // Query string parameters
        const searchParams = req.searchParams();

        // Headers
        const headers = req.headers();

        // Cookies
        const cookies = req.cookies();

        // Raw body as text
        const text = await req.text();

        // Raw body as bytes
        const bytes = await req.bytes();

        // Underlying Web API Request
        const webReq = req.webReq;

        // AbortSignal for cancellation
        const signal = req.signal;

        // You can read the req as an AsyncIterable stream
        for await (const chunk of req) {
            console.log("CHUNK:", chunk);
        }
    },
});
