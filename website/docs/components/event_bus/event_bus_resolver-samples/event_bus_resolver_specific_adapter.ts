await eventBusResolver.use("redis").dispatch("add", { a: 1, b: 2 });
