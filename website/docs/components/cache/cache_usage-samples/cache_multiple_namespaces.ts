import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";
import { Cache } from "eridu-tech/cache";

const cacheAdapter = new MemoryCacheAdapter();

type IUser = {
    name: string;
    email: string;
    age: number;
};
const userCache = new Cache<IUser>({
    adapter: cacheAdapter,
});

type IProduct = {
    name: string;
    price: number;
};
const productCache = new Cache<IProduct>({
    adapter: cacheAdapter,
});
