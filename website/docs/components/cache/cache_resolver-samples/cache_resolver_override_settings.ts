await cacheResolver
    .setDefaultTtl(TimeSpan.fromMinutes(5))
    .use("redis")
    .add("user/jose@gmail.com", {
        name: "Jose",
        age: 20,
    });
