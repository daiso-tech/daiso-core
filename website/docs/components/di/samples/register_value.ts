import { container } from "./initial_configuration";
import { CONFIG } from "./app_config";

container.registerValue({
    token: CONFIG,
    value: {
        apiUrl: "https://api.example.com",
        timeout: 5000,
    },
});
