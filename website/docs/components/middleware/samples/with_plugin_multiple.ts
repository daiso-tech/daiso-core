const monitoringPlugin: PluginFn<UserService> = (service, enhance) => {
    // Monitor methods...
};

const validationPlugin: PluginFn<UserService> = (service, enhance) => {
    // Validate methods...
};

const service = new UserService();
const enhancedService = withPlugin(service, [
    loggingPlugin,
    monitoringPlugin,
    validationPlugin,
]);
