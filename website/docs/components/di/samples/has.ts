import { container } from "./container";
import { Logger } from "./logger";

container.registerValue({
    token: Logger,
    value: new Logger(),
});

await container.init();

if (await container.has(Logger)) {
    console.log("Logger is resolvable");
}
