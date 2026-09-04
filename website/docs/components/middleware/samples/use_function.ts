const originalFn = (name: string, age: number): string => {
    return `${name} is ${age} years old`;
};

const wrappedFn = use(originalFn, loggingMiddleware);

// Call the wrapped function
const result = wrappedFn("Alice", 30);
// Logs: "Before invocation with args: ["Alice", 30]"
// Logs: "After invocation, result: Alice is 30 years old"
