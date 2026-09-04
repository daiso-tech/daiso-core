const hasUpdated = await fileStorage
    .create("file.txt")
    .update({ data: "TEXT 1" });
