const serviceAsObject = {
    invoke() {
        return "hello";
    },
} satisfies ServiceFactory;

// functionally equivalent to serviceAsFunction
const serviceAsFunction = (() => "hello") satisfies ServiceFactory;
