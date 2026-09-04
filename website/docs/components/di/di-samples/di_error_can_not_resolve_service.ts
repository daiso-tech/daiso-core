import { CanNotResolveServiceDiError } from "eridu-tech/di/contracts";

// Throws CanNotResolveServiceDiError because Logger is not registered
await container.resolveOrFail(Logger);
