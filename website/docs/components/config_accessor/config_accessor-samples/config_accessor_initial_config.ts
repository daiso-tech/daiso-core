import { ConfigAccessor } from "eridu-tech/config-accessor";
import { z } from "zod";

const config = {};

const schema = z.object({
    // Suppports primtive string, number, boolean values
    a: z.string(),

    // Suppports nested object with fields of string, number, boolean values
    b: z.object({
        a: z.string(),
    }),

    // Suppports array with item of string, number, boolean values
    c: z.string().array(),

    // Suppports array of object with fields of string, number, boolean values
    d: z
        .object({
            a: z.string(),
        })
        .array(),
});

const accessor = new ConfigAccessor({
    config,
    // Schema is optional, you can pass in a type
    schema,
});
