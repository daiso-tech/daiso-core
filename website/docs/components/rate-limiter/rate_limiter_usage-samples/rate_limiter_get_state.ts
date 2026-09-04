import { RATE_LIMITER_STATE } from "eridu-tech/rate-limiter/contracts";

const state = await rateLimiter.getState();

if (state === RATE_LIMITER_STATE.EXPIRED) {
    console.log("The rate limiter key doesnt exists");
}
if (state === RATE_LIMITER_STATE.ALLOWED) {
    console.log("The rate limiter is allowing calls");
}
if (state === RATE_LIMITER_STATE.BLOCKED) {
    console.log("The rate limiter is blocking calls");
}
