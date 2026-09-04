const logger = await container.resolveOr(Logger, new ConsoleLogger());
logger.log("Always has a logger");
