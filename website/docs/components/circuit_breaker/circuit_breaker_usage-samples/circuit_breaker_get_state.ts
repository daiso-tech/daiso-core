import { CIRCUIT_BREAKER_STATE } from "eridu-tech/circuit-breaker/contracts";

const state = await circuitBreaker.getState();

if (state === CIRCUIT_BREAKER_STATE.CLOSED) {
    console.log("The service is up and running without problems");
}
if (state === CIRCUIT_BREAKER_STATE.OPEN) {
    console.log("The service is down or degraded and you need to wait");
}
if (state === CIRCUIT_BREAKER_STATE.HALF_OPEN) {
    console.log(
        "Proping to check if the server is up and running or down / degraded",
    );
}
if (state === CIRCUIT_BREAKER_STATE.ISOLATED) {
    console.log("The service is held in open state manually until reseted");
}
