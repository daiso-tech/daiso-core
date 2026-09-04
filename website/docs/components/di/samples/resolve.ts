import { container } from "./container";
import { Logger } from "./logger";

const logger = await container.resolve(Logger);
if (logger) {
    logger.log("Logger is available");
}
