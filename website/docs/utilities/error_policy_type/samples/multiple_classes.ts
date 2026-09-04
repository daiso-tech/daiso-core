import { fallback } from "eridu-tech/resilience";
import { use } from "eridu-tech/middleware";

const func = use((): string => {
    return "asd";
}, [
    fallback({
        fallbackValue: "DEFAULT_VALUE",
        errorPolicy: [CustomErrorA, CustomErrorB],
    }),
]);

await func();
