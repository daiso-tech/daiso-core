import { createReadStream } from "node:fs";

const fileStream = createReadStream("./file.txt");

const hasAdded = await fileStorage
    .create("file.txt")
    .addStream({ data: fileStream });
