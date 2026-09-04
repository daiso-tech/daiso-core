import { CanNotResolveServiceDiError } from "eridu-tech/di/contracts";
import { container } from "./initial_configuration";
import { Logger } from "./logger";

// Throws CanNotResolveServiceDiError because Logger is not registered
await container.resolveOrFail(Logger);
