import { CanNotResolveServiceDiError } from "eridu-tech/di/contracts";
import { container } from "./container";
import { Logger } from "./logger";

// Throws CanNotResolveServiceDiError because Logger is not registered
await container.resolveOrFail(Logger);
