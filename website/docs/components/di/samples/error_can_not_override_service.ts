import { CanNotOverrideServiceDiError } from "eridu-tech/di/contracts";
import { container } from "./container";
import { CONFIG } from "./app_config";

// Throws CanNotOverrideServiceDiError because CONFIG token is not registered
// and hence cannot be overridden
try {
    container.overrideValue({
        token: CONFIG,
        value: { apiUrl: "http://localhost:9999", timeout: 100 },
    });
} catch (error) {
    if (error instanceof CanNotOverrideServiceDiError) {
        console.error(error);
    } else {
        throw error;
    }
}