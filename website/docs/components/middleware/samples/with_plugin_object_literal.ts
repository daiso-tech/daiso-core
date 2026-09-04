const calculator = {
    add(a: number, b: number): number {
        return a + b;
    },
    subtract(a: number, b: number): number {
        return a - b;
    },
};

const loggingPlugin: PluginFn<typeof calculator> = (obj, enhance) => {
    enhance(obj, "add", withPerformanceLogging());

    enhance(obj, "subtract", withPerformanceLogging());
};

const enhancedCalc = withPlugin(calculator, loggingPlugin);

enhancedCalc.add(2, 3);
// Logs: add called with: [2, 3]

// The original calculator object is NOT modified — a copy is returned instead
