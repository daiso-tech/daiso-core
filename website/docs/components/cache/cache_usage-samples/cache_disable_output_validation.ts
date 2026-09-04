const cache = new Cache({
    adapter: new MemoryCacheAdapter(),
    schema: userSchema,
    shouldValidateOutput: false,
});
