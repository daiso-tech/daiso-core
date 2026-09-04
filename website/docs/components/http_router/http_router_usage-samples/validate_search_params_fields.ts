import { z } from "zod";

const searchParamsSchema = z.object({
    include: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

const fieldsSchema = z.object({
    name: z.string(),
    age: z.coerce.number(),
});

router.endpoint({
    url: "/signup",
    method: ["POST"],
    handler: async ({ req, json }) => {
        const searchParams = req.searchParams(searchParamsSchema);
        const fields = await req.fields(fieldsSchema);

        return json({
            include: searchParams.include,
            tags: searchParams.tags,
            name: fields.name,
            age: fields.age,
        });
    },
});
