const userToken = contextToken<{ id: string; name: string }>("user");
executionContext.put(userToken, { id: "123", name: "Alice" });
// TypeScript will error if you try to put a value of the wrong type.
