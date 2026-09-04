await cacheResolver.use("redis").add("user/jose@gmail.com", {
    name: "Jose",
    age: 20,
});
