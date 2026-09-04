await eventBus.listenOnce("add", (event) => {
    console.log(event);
});

// Listener will be only triggered here
await eventBus.dispatch("add", {
    a: 5,
    b: 5,
});

// Listener will not be triggered because it removed after the first dispatch.
await eventBus.dispatch("add", {
    a: 3,
    b: 3,
});
