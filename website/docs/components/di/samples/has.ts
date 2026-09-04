import { container } from "./initial_configuration";
import { Logger } from "./logger";

if (await container.has(Logger)) {
    console.log("Logger is resolvable");
}
