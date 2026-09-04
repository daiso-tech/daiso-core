type AddEvent = {
    a: number;
    b: number;
};
class Listener implements IEventListenerObject<AddEvent> {
    private count = 0;

    invoke(event: AddEvent): void {
        console.log("EVENT:", event);
        console.log("COUNT:", count);
        this.count++;
    }
}

await eventBus.addListener("add", new Listener());
await eventBus.dispatch("add", {
    a: 1,
    b: 2,
});
await eventBus.dispatch("add", {
    a: 3,
    b: -1,
});
