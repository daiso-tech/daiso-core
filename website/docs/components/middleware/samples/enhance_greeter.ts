import { enhance } from "eridu-tech/middleware";

class Greeter {
    greet(name: string): string {
        return `Hello, ${name}!`;
    }
}

const greeter = new Greeter();

// Example middleware that logs calls
function loggingMiddleware<
    TParameters extends Array<unknown>,
    TReturn,
>(): MiddlewareFn<TParameters, TReturn> {
    return ({ args, next }) => {
        console.log("Calling greet with:", args);
        const result = next(args);
        console.log("Result:", result);
        return result;
    };
}

// Enhance the 'greet' method with middleware
enhance(greeter, "greet", loggingMiddleware());

greeter.greet("Alice");
// Logs:
// Calling greet with: ["Alice"]
// Result: Hello, Alice!
