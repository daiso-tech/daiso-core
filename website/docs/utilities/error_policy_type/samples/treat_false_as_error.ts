import { retry } from "eridu-tech/resilience";
import { use } from "eridu-tech/middleware";

const func = use(async (): Promise<boolean> => {
    // Will be
    console.log("EXECUTING");
    return false;
}, [
    retry({
        maxAttempts: 4,
        errorPolicy: {
            treatFalseAsError: true,
        },
    }),
]);

await func();
