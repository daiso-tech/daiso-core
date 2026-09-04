import { container } from "./container";
import { CONFIG } from "./app_config";

container.registerValue({
    token: CONFIG,
    value: { apiUrl: "https://api.example.com", timeout: 5000 },
});

const childContainer = container.fork();

// Override in the child container — parent is unaffected
childContainer.overrideValue({
    token: CONFIG,
    value: { apiUrl: "http://test.local", timeout: 100 },
});

// Both containers must be initialized before resolving
await container.init();
await childContainer.init();

// Original container still has the original config
const parentConfig = await container.resolveOrFail(CONFIG);
const childConfig = await childContainer.resolveOrFail(CONFIG);

console.log(parentConfig.apiUrl); // "https://api.example.com"
console.log(childConfig.apiUrl); // "http://test.local"
