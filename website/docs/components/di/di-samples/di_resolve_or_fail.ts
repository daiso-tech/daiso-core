// Throws CanNotResolveServiceDiError if Logger is not registered
const logger = await container.resolveOrFail(Logger);
