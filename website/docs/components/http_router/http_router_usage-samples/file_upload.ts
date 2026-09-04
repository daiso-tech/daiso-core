router.endpoint({
    url: "/upload",
    method: ["POST"],
    handler: async ({ req, json }) => {
        const files = await req.files();

        // Single file: get the first file, or a 400 if none was uploaded.
        const avatar = files["avatar"].firstOrFail();

        // Multiple files: iterate the collection directly.
        for (const document of files["documents"]) {
            console.log(document.name);
        }

        // Inspect the file...
        const content = await avatar.asText();
        const name = avatar.name;
        const type = avatar.contentType;
        const size = avatar.fileSize;

        return json({
            name,
            type,
            sizeInBytes: size.toBytes(),
            content,
        });
    },
});
