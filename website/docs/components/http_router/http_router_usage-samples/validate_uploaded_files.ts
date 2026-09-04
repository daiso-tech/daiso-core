import { FileSize } from "eridu-tech/file-size";
import { type FileInputs } from "eridu-tech/http-router/contracts";

const fileInputs = {
    // Static validation rules known ahead of time.
    avatar: {
        contentType: "image/png",
        fileSize: FileSize.fromMegaBytes(5),
        name: /\.png$/,
        max: 1,
        optional: false,
    },
    // Dynamic validation rules not known ahead of time.
    // returns an error message string, or `null` when the files pass.
    docs: (collection) => (collection.size() > 2 ? "Too many documents" : null),
} satisfies FileInputs;

router.endpoint({
    url: "/upload-avatar",
    method: ["POST"],
    handler: async ({ req }) => {
        const files = await req.files(fileInputs);

        const avatarFiles = files.avatar;
        const file = avatarFiles.firstOrFail();
        const content = await file.asBytes();
        // Process the avatar...
    },
});
