import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";
import { Cache } from "eridu-tech/cache";

type IUser = {
    type: "USER";
    name: string;
    email: string;
    age: number;
};
type IProduct = {
    type: "PRODUCT";
    name: string;
    price: number;
};
type CacheValue = IUser | IProduct;

const cache = new Cache<CacheValue>({
    adapter: new MemoryCacheAdapter(),
});

const cacheValue = await cache.get("user1");
// You need to check the type is "USER" inorder to access IUser fields.
if (cacheValue.type === "USER") {
    console.log(cacheValue.name, cacheValue.age);
}
// You need to check the type is "PRODUCT" inorder to access IProduct fields.
if (cacheValue.type === "PRODUCT") {
    console.log(cacheValue.name, cacheValue.price);
}
