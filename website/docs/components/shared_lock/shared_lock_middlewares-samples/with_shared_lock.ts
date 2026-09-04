import {
    withSharedLockFactory,
    SHARED_LOCK_WHEN,
} from "eridu-tech/shared-lock/middlewares";
import { SharedLockFactory } from "eridu-tech/shared-lock";
import { MemorySharedLockAdapter } from "eridu-tech/shared-lock/memory-shared-lock-adapter";

const sharedLockFactory = new SharedLockFactory({
    adapter: new MemorySharedLockAdapter(),
});
const withSharedLock = withSharedLockFactory(sharedLockFactory);

const readData = async (key: string): Promise<unknown> => {
    // Safe to run concurrently with other readers
    return { data: "..." };
};

// Wrap with shared-lock in reader mode — multiple readers allowed
const safeRead = use(
    readData,
    withSharedLock({
        key: (resourceKey) => `data:${resourceKey}`,
        when: SHARED_LOCK_WHEN.READER,
        limit: 10, // Up to 10 concurrent readers
    }),
);

const writeData = async (key: string): Promise<unknown> => {
    // Safe to run concurrently as only writer
};

// Wrap with shared-lock in writer mode — only writer allowed
const safeWrite = use(
    writeData,
    withSharedLock({
        key: (resourceKey) => `data:${resourceKey}`,
        when: SHARED_LOCK_WHEN.WRITER,
        limit: 10,
    }),
);

await writeData("config");
