class Person {
    say(message: string) {
        return `Person says: ${message}`;
    }
}

enhance(Person.prototype, "say", loggingMiddleware());

const alice = new Person();
alice.say("Hello!");
// Logs:
// Calling greet with: ["Hello!"]
// Result: Person says: Hello!
