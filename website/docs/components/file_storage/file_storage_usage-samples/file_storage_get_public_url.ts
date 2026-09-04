const file = fileStorage.create("source.txt");
await file.add("CONTENT");

const publicUrl = await file.getPublicUrl();

console.log(publicUrl);
