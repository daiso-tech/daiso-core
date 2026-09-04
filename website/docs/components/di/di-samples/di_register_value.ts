interface AppConfig {
    apiUrl: string;
    timeout: number;
}

const CONFIG = genericToken<AppConfig>("AppConfig");

container.registerValue({
    token: CONFIG,
    value: {
        apiUrl: "https://api.example.com",
        timeout: 5000,
    },
});
