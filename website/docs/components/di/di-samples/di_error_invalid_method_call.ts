import { InvalidMethodCallDiError } from "eridu-tech/di/contracts";
await container.init();

// Throws InvalidMethodCallDiError because registration is attempted after init()
container.registerValue({
    token: CONFIG,
    value: { apiUrl: "https://another.example.com", timeout: 3000 },
});
