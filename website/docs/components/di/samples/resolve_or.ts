import { container } from "./container";
import { ConsoleLogger, Logger } from "./logger";

await container.init();

const logger = await container.resolveOr(Logger, new ConsoleLogger());
logger.log("Always has a logger");
