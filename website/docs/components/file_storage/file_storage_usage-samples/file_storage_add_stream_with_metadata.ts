const fileStream = createReadStream("./file.txt")

const hasAdded = await fileStorage.create("file.txt").addStream({
    data: fileStream

    /**
     * You can explicitly set a custom Content-Type. If one is not provided, it will be inferred from the key. For example, a key ending in .txt (such as key-a.txt) will be assigned text/plain.
     * If the key contains a non-standard extension it will default to application/octet-stream.
     */
    contentType: "text/plain",

    /**
     * Note a default value is always provided. To explicitly unset a field and prevent it from being passed to the underlying adapter, pass in `null`.
     */
    contentLanguage: "en-US",

    /**
     * Note a default value is always provided. To explicitly unset a field and prevent it from being passed to the underlying adapter, pass in `null`.
     */
    contentEncoding: "gzip",

    /**
     * Note a default value is always provided. To explicitly unset a field and prevent it from being passed to the underlying adapter, pass in `null`.
     */
    contentDisposition: "inline",

    /**
     * Note a default value is always provided. To explicitly unset a field and prevent it from being passed to the underlying adapter, pass in `null`.
     */
    cacheControl: "no-cache",
});
