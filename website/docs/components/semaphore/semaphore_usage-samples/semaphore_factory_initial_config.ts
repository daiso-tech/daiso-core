import { TimeSpan } from "eridu-tech/time-span";
import { MemorySemaphoreAdapter } from "eridu-tech/semaphore/memory-semaphore-adapter";
import { SemaphoreFactory } from "eridu-tech/semaphore";

const semaphoreFactory = new SemaphoreFactory({
    // You can provide default TTL value
    // If you set it to null it means semaphores will not expire and most be released manually by default.
    defaultTtl: TimeSpan.fromSeconds(2),

    // You can choose the adapter to use
    adapter: new MemorySemaphoreAdapter(),
});
