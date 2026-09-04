executionContext.run(() => {
    executionContext.put(userToken, { id: "123", name: "Alice" });
    executionContext.put(requestIdToken, "req-456");

    const logData = executionContext.bind((msg: string): void => {
        // Access context values later in the call chain
        const user = executionContext.get(userToken); // { id: "123", name: "Alice" }
        const reqId = executionContext.get(requestIdToken); // "req-456"
        console.log("message:", msg);
        console.log("user:", user);
        console.log("reqId:", reqId);
    });

    logData("hello");
});
