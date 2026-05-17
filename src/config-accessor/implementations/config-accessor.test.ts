import { describe, test, expect } from "vitest";
import { z } from "zod";

import { type BaseConfig } from "@/config-accessor/contracts/_module.js";
import { ConfigAccessor } from "@/config-accessor/implementations/_module.js";
import { ValidationError } from "@/utilities/_module.js";

describe("class: ConfigAccessor", () => {
    describe("class: ConfigAccessor", () => {
        describe("constructor:", () => {
            test("Should throw ValidationError when given a schema and invalid config object", () => {
                const config: BaseConfig = {
                    app: {
                        foo: 123,
                    },
                };
                const schema = z.object({
                    app: z.object({
                        foo: z.string(),
                    }),
                });

                expect(() => new ConfigAccessor({ config, schema })).toThrow(
                    ValidationError,
                );
            });
        });

        describe("method: get", () => {
            test("Should return null when rooth path doesnt exists", () => {
                type ConfigObject = {
                    app?: {
                        foo?: string;
                    };
                };

                const config: ConfigObject = {};
                const accessor = new ConfigAccessor({ config });

                const rootConfig = accessor.get("app");
                const nestedConfig = accessor.get("app.foo");

                expect(rootConfig).toBeNull();
                expect(nestedConfig).toBeNull();
            });
            test("Should return null when root path exists and nested path doesnt exists", () => {
                type ConfigObject = {
                    app?: {
                        foo?: string;
                    };
                };

                const config: ConfigObject = {
                    app: {},
                };
                const accessor = new ConfigAccessor({ config });

                const nestedConfig = accessor.get("app.foo");

                expect(nestedConfig).toBeNull();
            });
            test("Should return null when root path exists and nested array path doesnt exists", () => {
                type ConfigObject = {
                    app?: Array<{
                        foo?: string;
                    }>;
                };

                const config: ConfigObject = {
                    app: [],
                };
                const accessor = new ConfigAccessor({ config });

                const nestedConfig = accessor.get("app.0");

                expect(nestedConfig).toBeNull();
            });
            test("Should return root path when exists and is an object", () => {
                type ConfigObject = {
                    app?: {
                        foo?: string;
                    };
                };

                const config: ConfigObject = {
                    app: {
                        foo: "bar",
                    },
                };
                const accessor = new ConfigAccessor({ config });

                const rootConfig = accessor.get("app");

                expect(rootConfig).toEqual(config.app);
            });
            test("Should return root path when exists and is a string", () => {
                type ConfigObject = {
                    app?: string;
                };

                const config: ConfigObject = {
                    app: "bar",
                };
                const accessor = new ConfigAccessor({ config });

                const rootConfig = accessor.get("app");

                expect(rootConfig).toEqual(config.app);
            });
            test("Should return root path when exists and is a number", () => {
                type ConfigObject = {
                    app?: number;
                };

                const config: ConfigObject = {
                    app: 20,
                };
                const accessor = new ConfigAccessor({ config });

                const rootConfig = accessor.get("app");

                expect(rootConfig).toEqual(config.app);
            });
            test("Should return root path when exists and is a boolean", () => {
                type ConfigObject = {
                    app?: boolean;
                };

                const config: ConfigObject = {
                    app: true,
                };
                const accessor = new ConfigAccessor({ config });

                const rootConfig = accessor.get("app");

                expect(rootConfig).toEqual(config.app);
            });
            test("Should return root path when exists and is a array of primitives", () => {
                type ConfigObject = {
                    app?: Array<string | number | boolean>;
                };

                const config: ConfigObject = {
                    app: [1, "a", false],
                };
                const accessor = new ConfigAccessor({ config });

                const rootConfig = accessor.get("app");

                expect(rootConfig).toEqual(config.app);
            });
            test("Should return nested path when exists and is a string", () => {
                type ConfigObject = {
                    app?: {
                        foo?: string;
                    };
                };

                const config: ConfigObject = {
                    app: {
                        foo: "bar",
                    },
                };
                const accessor = new ConfigAccessor({ config });

                const nestedConfig = accessor.get("app.foo");

                expect(nestedConfig).toBe(config.app?.foo);
            });
            test("Should return nested path when exists and is a number", () => {
                type ConfigObject = {
                    app?: {
                        foo?: number;
                    };
                };

                const config: ConfigObject = {
                    app: {
                        foo: 2,
                    },
                };
                const accessor = new ConfigAccessor({ config });

                const nestedConfig = accessor.get("app.foo");

                expect(nestedConfig).toBe(config.app?.foo);
            });
            test("Should return nested path when exists and is a boolean", () => {
                type ConfigObject = {
                    app?: {
                        foo?: boolean;
                    };
                };

                const config: ConfigObject = {
                    app: {
                        foo: true,
                    },
                };
                const accessor = new ConfigAccessor({ config });

                const nestedConfig = accessor.get("app.foo");

                expect(nestedConfig).toBe(config.app?.foo);
            });
            test("Should return nested path when exists and is a object", () => {
                type ConfigObject = {
                    app?: Array<{
                        foo?: string;
                    }>;
                };

                const config: ConfigObject = {
                    app: [
                        {
                            foo: "bar",
                        },
                    ],
                };
                const accessor = new ConfigAccessor({ config });

                const nestedConfig = accessor.get("app.0");

                expect(nestedConfig).toBe(config.app?.[0]);
            });
        });
        describe("method: getOr", () => {
            test("Should return default value when rooth path doesnt exists", () => {
                type ConfigObject = {
                    app?: {
                        foo?: string;
                    };
                };

                const config: ConfigObject = {};
                const accessor = new ConfigAccessor({ config });

                const defaultRootValue = {
                    foo: "default",
                };
                const rootConfig = accessor.getOr("app", defaultRootValue);
                const nestedDefaultValue = "default";
                const nestedConfig = accessor.getOr(
                    "app.foo",
                    nestedDefaultValue,
                );

                expect(rootConfig).toEqual(defaultRootValue);
                expect(nestedConfig).toBe("default");
            });
            test("Should return default value when root path exists and nested path doesnt exists", () => {
                type ConfigObject = {
                    app?: {
                        foo?: string;
                    };
                };

                const config: ConfigObject = {
                    app: {},
                };
                const accessor = new ConfigAccessor({ config });

                const defaultNestedValue = "default";
                const nestedConfig = accessor.getOr(
                    "app.foo",
                    defaultNestedValue,
                );

                expect(nestedConfig).toBe(defaultNestedValue);
            });
            test("Should return default value when root path exists and nested array path doesnt exists", () => {
                type ConfigObject = {
                    app?: Array<{
                        foo?: string;
                    }>;
                };

                const config: ConfigObject = {
                    app: [],
                };
                const accessor = new ConfigAccessor({ config });

                const defaultValue = {};
                const nestedConfig = accessor.getOr("app.0", defaultValue);

                expect(nestedConfig).toEqual(defaultValue);
            });
            test("Should return root path when exists and is an object", () => {
                type ConfigObject = {
                    app?: {
                        foo?: string;
                    };
                };

                const config: ConfigObject = {
                    app: {
                        foo: "bar",
                    },
                };
                const accessor = new ConfigAccessor({ config });

                const rootConfig = accessor.getOr("app", {});

                expect(rootConfig).toEqual(config.app);
            });
            test("Should return root path when exists and is a string", () => {
                type ConfigObject = {
                    app?: string;
                };

                const config: ConfigObject = {
                    app: "bar",
                };
                const accessor = new ConfigAccessor({ config });

                const rootConfig = accessor.getOr("app", "");

                expect(rootConfig).toEqual(config.app);
            });
            test("Should return root path when exists and is a number", () => {
                type ConfigObject = {
                    app?: number;
                };

                const config: ConfigObject = {
                    app: 20,
                };
                const accessor = new ConfigAccessor({ config });

                const rootConfig = accessor.getOr("app", 0);

                expect(rootConfig).toEqual(config.app);
            });
            test("Should return root path when exists and is a boolean", () => {
                type ConfigObject = {
                    app?: boolean;
                };

                const config: ConfigObject = {
                    app: true,
                };
                const accessor = new ConfigAccessor({ config });

                const rootConfig = accessor.getOr("app", false);

                expect(rootConfig).toEqual(config.app);
            });
            test("Should return root path when exists and is a array of primitives", () => {
                type ConfigObject = {
                    app?: Array<string | number | boolean>;
                };

                const config: ConfigObject = {
                    app: [1, "a", false],
                };
                const accessor = new ConfigAccessor({ config });

                const rootConfig = accessor.getOr("app", []);

                expect(rootConfig).toEqual(config.app);
            });
            test("Should return nested path when exists and is a string", () => {
                type ConfigObject = {
                    app?: {
                        foo?: string;
                    };
                };

                const config: ConfigObject = {
                    app: {
                        foo: "bar",
                    },
                };
                const accessor = new ConfigAccessor({ config });

                const nestedConfig = accessor.getOr("app.foo", "");

                expect(nestedConfig).toBe(config.app?.foo);
            });
            test("Should return nested path when exists and is a number", () => {
                type ConfigObject = {
                    app?: {
                        foo?: number;
                    };
                };

                const config: ConfigObject = {
                    app: {
                        foo: 2,
                    },
                };
                const accessor = new ConfigAccessor({ config });

                const nestedConfig = accessor.getOr("app.foo", 0);

                expect(nestedConfig).toBe(config.app?.foo);
            });
            test("Should return nested path when exists and is a boolean", () => {
                type ConfigObject = {
                    app?: {
                        foo?: boolean;
                    };
                };

                const config: ConfigObject = {
                    app: {
                        foo: true,
                    },
                };
                const accessor = new ConfigAccessor({ config });

                const nestedConfig = accessor.getOr("app.foo", false);

                expect(nestedConfig).toBe(config.app?.foo);
            });
            test("Should return nested path when exists and is a object", () => {
                type ConfigObject = {
                    app?: Array<{
                        foo?: string;
                    }>;
                };

                const config: ConfigObject = {
                    app: [
                        {
                            foo: "bar",
                        },
                    ],
                };
                const accessor = new ConfigAccessor({ config });

                const nestedConfig = accessor.getOr("app.0", {});

                expect(nestedConfig).toBe(config.app?.[0]);
            });
        });
    });
});
