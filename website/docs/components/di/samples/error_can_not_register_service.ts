import { CanNotRegisterServiceDiError } from "eridu-tech/di/contracts";
import { container } from "./container";
import { CONFIG } from "./app_config";

container.registerValue({
    token: CONFIG,
    value: { apiUrl: "https://api.example.com", timeout: 5000 },
});

// Throws CanNotRegisterServiceDiError because CONFIG token is already registered
try {
    container.registerValue({
        token: CONFIG,
        value: { apiUrl: "https://another.example.com", timeout: 3000 },
    });
} catch (error) {
    if (error instanceof CanNotRegisterServiceDiError) {
        console.error(error);
    } else {
        throw error;
    }
}
