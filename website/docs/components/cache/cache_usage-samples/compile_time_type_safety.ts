import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";
import { Cache } from "eridu-tech/cache";

type IUser = {
    name: string;
    email: string;
    age: number;
};

const cache = new Cache<IUser>({
    adapter: new MemoryCacheAdapter(),
});

// A typescript error will occur because the type is not matching.
await cache.add("a", "asd");
