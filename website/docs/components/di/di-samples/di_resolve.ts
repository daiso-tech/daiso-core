const logger = await container.resolve(Logger);
if (logger) {
    logger.log("Logger is available");
}
