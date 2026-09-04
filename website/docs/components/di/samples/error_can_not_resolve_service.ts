import { CanNotResolveServiceDiError } from "eridu-tech/di/contracts";
import { container } from "./container";
import { Logger } from "./logger";

await container.init();

// Throws CanNotResolveServiceDiError because Logger is not registered
try {
    await container.resolveOrFail(Logger);
} catch (error) {
    if (error instanceof CanNotResolveServiceDiError) {
        console.error(error);
    } else {
        throw error;
    }
}
