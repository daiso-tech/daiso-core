import { z } from "zod";

const responseSchema = z.object({ name: z.string() });

handler: async ({ json }) => json({ name: "John" }, responseSchema);
