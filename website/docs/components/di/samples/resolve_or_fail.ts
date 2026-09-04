import { container } from "./initial_configuration";
import { Logger } from "./logger";

// Throws CanNotResolveServiceDiError if Logger is not registered
const logger = await container.resolveOrFail(Logger);
