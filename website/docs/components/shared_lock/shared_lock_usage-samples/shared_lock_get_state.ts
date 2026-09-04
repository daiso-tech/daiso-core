import { SHARED_LOCK_STATE } from "eridu-tech/shared-lock/contracts";

const sharedLock = sharedLockFactory.create("shared-resource", {
    limit: 2,
});
const state = await sharedLock.getState();

if (state.type === SHARED_LOCK_STATE.EXPIRED) {
    console.log("The shared-lock doesnt exists");
}

if (state.type === SHARED_LOCK_STATE.READER_LIMIT_REACHED) {
    console.log(
        "The shared-lock is in reader mode and limit have been reached and all slots are unavailable",
    );
}

if (state.type === SHARED_LOCK_STATE.READER_ACQUIRED) {
    console.log("The shared-lock is in reader mode and is acquired");
}

if (state.type === SHARED_LOCK_STATE.READER_UNACQUIRED) {
    console.log(
        "The shared-lock is in reader mode and there are avilable slots but the shared-lock is not acquired",
    );
}

if (state.type === SHARED_LOCK_STATE.WRITER_UNAVAILABLE) {
    console.log(
        "The shared-lock is in writer mode and is acquired by different owner",
    );
}

if (state.type === SHARED_LOCK_STATE.WRITER_ACQUIRED) {
    console.log("The shared-lock is in writer mode and is acquired");
}
