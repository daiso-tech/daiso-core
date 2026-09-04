await fileStorageResolver
    .setNamespace(new Namespace("@my-namespace"))
    .use("fs")
    .create("file.txt")
    .add("Text file content");
