import { LOCK_STATE } from "eridu-tech/lock/contracts";

const lock = lockFactory.create("shared-resource");
const state = await lock.getState();

if (state.type === LOCK_STATE.EXPIRED) {
    console.log("The lock doesnt exists");
}

if (state.type === LOCK_STATE.UNAVAILABLE) {
    console.log("Lock is acquired by different owner");
}

if (state.type === LOCK_STATE.ACQUIRED) {
    console.log("The lock is acquired");
}
