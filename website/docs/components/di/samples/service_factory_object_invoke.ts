import type { ServiceFactory } from "eridu-tech/di/contracts";

const serviceAsObject = {
    invoke() {
        return "hello";
    },
} satisfies ServiceFactory;

// functionally equivalent to serviceAsFunction
const serviceAsFunction = (() => "hello") satisfies ServiceFactory;
