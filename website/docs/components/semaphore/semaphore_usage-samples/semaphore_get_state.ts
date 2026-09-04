import { SEMAPHORE_STATE } from "eridu-tech/semaphore/contracts";

const semaphore = semaphoreFactory.create("shared-resource", {
    limit: 2,
});
const state = await semaphore.getState();

if (state.type === SEMAPHORE_STATE.EXPIRED) {
    console.log("The semaphore doesnt exists");
}

if (state.type === SEMAPHORE_STATE.LIMIT_REACHED) {
    console.log("The limit have been reached and all slots are unavailable");
}

if (state.type === SEMAPHORE_STATE.ACQUIRED) {
    console.log("The semaphore is acquired");
}

if (state.type === SEMAPHORE_STATE.UNACQUIRED) {
    console.log("There are avilable slots but the semaphore is not acquired");
}
