import { InvalidMethodCallDiError } from "eridu-tech/di/contracts";
import { container } from "./initial_configuration";
import { CONFIG } from "./app_config";

await container.init();

// Throws InvalidMethodCallDiError because registration is attempted after init()
container.registerValue({
    token: CONFIG,
    value: { apiUrl: "https://another.example.com", timeout: 3000 },
});
