import { container } from "./container";
import { Logger } from "./logger";

// Throws CanNotResolveServiceDiError if Logger is not registered
const logger = await container.resolveOrFail(Logger);
