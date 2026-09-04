import { TimeSpan } from "eridu-tech/time-span";
import { MemorySharedLockAdapter } from "eridu-tech/shared-lock/memory-shared-lock-adapter";
import { SharedLockFactory } from "eridu-tech/shared-lock";

const sharedLockFactory = new SharedLockFactory({
    // You can provide default TTL value
    // If you set it to null it means shared-locks will not expire and most be released manually by default.
    defaultTtl: TimeSpan.fromSeconds(2),

    // You can choose the adapter to use
    adapter: new MemorySharedLockAdapter(),
});
