const hasRemoved = await fileStorage.create("file.txt").remove();
console.log(hasRemoved);
