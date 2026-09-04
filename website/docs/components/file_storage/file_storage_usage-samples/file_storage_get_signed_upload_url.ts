const uploadUrl = await fileStorage.create("source.txt").getSignedUploadUrl({
    // All settings are optional
    ttl: TimeSpan.fromMinutes(10)
    // The content type will be infered from the filename by default
    contentType: "text/plain"
})
console.log(uploadUrl)
