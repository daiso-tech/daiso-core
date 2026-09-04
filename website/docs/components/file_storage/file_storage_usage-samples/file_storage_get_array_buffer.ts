const content = await fileStorage.create("file.txt").getArrayBuffer();

console.log(content);
