import { z } from "zod";

const jsonSchema = z.object({
    name: z.string(),
    age: z.number(),
});

router.endpoint({
    url: "/users",
    method: ["POST"],
    handler: async ({ req, json }) => {
        const body = await req.json(jsonSchema);

        return json({ name: body.name, age: body.age });
    },
});
