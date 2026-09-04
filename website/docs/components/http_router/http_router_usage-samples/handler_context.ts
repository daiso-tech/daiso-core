import { contextToken } from "eridu-tech/execution-context";

type IUser = {
    id: string;
    firstName: string;
    lastName: string;
};

async function loadUser(): Promise<IUser> {
    // ...
}

const token = contextToken<IUser>("USER");

router.use(async ({ context, next }) => {
    context.put(token, await loadUser());
    return await next();
});

router.endpoint({
    url: "/profile",
    method: ["GET"],
    handler: async ({ context, json }) => {
        const user = context.getOrFail(token);
        return json(user);
    },
});
