import { CanNotRegisterServiceDiError } from "eridu-tech/di/contracts";
import { container } from "./initial_configuration";
import { CONFIG } from "./app_config";

container.registerValue({
    token: CONFIG,
    value: { apiUrl: "https://api.example.com", timeout: 5000 },
});

// Throws CanNotRegisterServiceDiError because CONFIG token is already registered
container.registerValue({
    token: CONFIG,
    value: { apiUrl: "https://another.example.com", timeout: 3000 },
});
