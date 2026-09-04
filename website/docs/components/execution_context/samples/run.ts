// Define context tokens with type-safe identifiers
type User = { id: string; name: string };
const userToken = contextToken<User>("user");
const requestIdToken = contextToken<string>("requestId");

function logData(): void {
    // Access context values later in the call chain

    // { id: "123", name: "Alice" }
    const user = executionContext.get(userToken);
    // "req-456"
    const reqId = executionContext.get(requestIdToken);

    console.log("user:", user);
    console.log("reqId:", reqId);
}

executionContext.run(() => {
    executionContext.put(userToken, { id: "123", name: "Alice" });
    executionContext.put(requestIdToken, "req-456");
    logData();
});
