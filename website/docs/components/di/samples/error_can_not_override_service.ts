import { CanNotOverrideServiceDiError } from "eridu-tech/di/contracts";
import { container } from "./container";
import { CONFIG } from "./app_config";

// Throws CanNotOverrideServiceDiError because CONFIG token is not registered
// and hence cannot be overridden
container.overrideValue({
    token: CONFIG,
    value: { apiUrl: "http://localhost:9999", timeout: 100 },
});
