import { withLockFactory } from "eridu-tech/lock/middlewares";
import { LockFactory } from "eridu-tech/lock";
import { MemoryLockAdapter } from "eridu-tech/lock/memory-lock-adapter";

const lockFactory = new LockFactory({
    adapter: new MemoryLockAdapter(),
});
const withLock = withLockFactory(lockFactory);

const processJob = async (jobId: string): Promise<void> => {
    // Critical section — only one process should execute this at a time
    await process(jobId);
};

// Wrap with distributed lock
const safeProcess = use(
    processJob,
    withLock({
        key: (jobId) => `job:${jobId}`,
    }),
);

await safeProcess("job-123"); // Acquires lock, processes, releases lock
