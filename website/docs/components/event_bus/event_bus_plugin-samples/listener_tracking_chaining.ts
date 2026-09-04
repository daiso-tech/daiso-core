const enhancedAdapter = withPlugin(adapter, [
    withListenerTracking(pluginA),
    withListenerTracking(pluginB),
]);
