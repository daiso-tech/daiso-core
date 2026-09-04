const contentTypeAdapter = withPlugin(
    adapter,
    withFileStorageInferContentTypeOnWrite({
        inferSignedDownloadUrl: false,
        inferSignedUploadUrl: false,
    }),
);
