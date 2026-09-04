import { container } from "./container";
import { CONFIG } from "./app_config";

container.registerValue({
    token: CONFIG,
    value: {
        apiUrl: "https://api.example.com",
        timeout: 5000,
    },
});
