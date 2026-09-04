await cache.put("a", 2);
await cache.put("a", 4, TimeSpan.fromSeconds(3));
