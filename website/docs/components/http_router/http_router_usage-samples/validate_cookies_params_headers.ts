import { z } from "zod";

const cookiesSchema = z.object({ session: z.string().optional() });
const paramsSchema = z.object({ id: z.string() });
const headersSchema = z.object({ authorization: z.string() });

router.endpoint({
    url: "/users/:id",
    method: ["GET"],
    handler: async ({ req, json }) => {
        const cookies = req.cookies(cookiesSchema);
        const params = req.params(paramsSchema);
        const headers = req.headers(headersSchema);

        return json({
            userId: params.id,
            session: cookies.session,
            auth: headers.authorization,
        });
    },
});
