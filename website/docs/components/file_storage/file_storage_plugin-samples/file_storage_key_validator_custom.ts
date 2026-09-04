const validatedAdapter = withPlugin(
    adapter,
    withFileStorageKeyValidator((key) => {
        if (key.startsWith("temp/")) {
            return "Keys under temp/ are not allowed";
        }
        return null;
    }),
);
