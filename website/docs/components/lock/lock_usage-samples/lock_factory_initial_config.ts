import { TimeSpan } from "eridu-tech/time-span";
import { MemoryLockAdapter } from "eridu-tech/lock/memory-lock-adapter";
import { LockFactory } from "eridu-tech/lock";

const lockFactory = new LockFactory({
    // You can provide default TTL value
    // If you set it to null it means locks will not expire and most be released manually by default.
    defaultTtl: TimeSpan.fromSeconds(2),

    // You can choose the adapter to use
    adapter: new MemoryLockAdapter(),
});
