import { fallback } from "eridu-tech/resilience";
import { use } from "eridu-tech/middleware";

class CustomError extends Error {
    constructor(
        readonly errorCode: string,
        message: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = CustomError.name;
    }
}

const func = use((): string => {
    return "asd";
}, [
    fallback({
        fallbackValue: "DEFAULT_VALUE",
        errorPolicy: (error) => error instanceof CustomError,
    }),
]);

await func();
