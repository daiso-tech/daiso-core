/**
 * @module CircuitBreaker
 */
import {
    BACKOFFS,
    backoffsLua,
} from "@/backoff-policies/implementations/_module.js";
import { circuitBreakerLua } from "@/circuit-breaker/implementations/adapters/redis-circuit-breaker-adapter/lua/circuit-breaker-lua.js";
import { circuitBreakerStateManagerLua } from "@/circuit-breaker/implementations/adapters/redis-circuit-breaker-adapter/lua/circuit-breaker-state-manager-lua.js";
import { circuitBreakerStorageLua } from "@/circuit-breaker/implementations/adapters/redis-circuit-breaker-adapter/lua/circuit-breaker-storage-lua.js";
import { consecutiveBreakerLua } from "@/circuit-breaker/implementations/adapters/redis-circuit-breaker-adapter/lua/consecutive-breaker-lua.js";
import { countBreakerLua } from "@/circuit-breaker/implementations/adapters/redis-circuit-breaker-adapter/lua/count-breaker-lua.js";
import { circuitBreakerPolicyLua } from "@/circuit-breaker/implementations/adapters/redis-circuit-breaker-adapter/lua/internal-circuit-breaker-policy-lua.js";
import { samplingBreakerLua } from "@/circuit-breaker/implementations/adapters/redis-circuit-breaker-adapter/lua/sampling-breaker-lua.js";
import { BREAKER_POLICIES } from "@/circuit-breaker/implementations/policies/_module.js";

/**
 * @internal
 */
export const circuitBreakerFactoryLua = `
${backoffsLua}

-- @param settings Required<SerializedBackoffSettingsEnum>
-- @return BackoffPolicy
local function backoffPolicyFactory(settings)
    if settings.type == "${BACKOFFS.CONSTANT}" then
        return constantBackoff(settings)
    end
    
    if settings.type == "${BACKOFFS.EXPONENTIAL}" then
        return exponentialBackoff(settings)
    end
    
    if settings.type == "${BACKOFFS.LINEAR}" then
        return linearBackoff(settings)
    end
    
    if settings.type == "${BACKOFFS.POLYNOMIAL}" then
        return polynomialBackoff(settings)
    end
end

${consecutiveBreakerLua}
${countBreakerLua}
${samplingBreakerLua}

-- @param settings Required<CircuitBreakerPolicySettingsEnum>
-- @return ICircuitBreakerPolicy
local function circuitBreakerPolicyFactory(settings)
    if settings.type == "${BREAKER_POLICIES.CONSECUTIVE}" then
        return ConsecutiveBreaker(settings)
    end

    if settings.type == "${BREAKER_POLICIES.COUNT}" then
        return CountBreaker(settings)
    end

    if settings.type == "${BREAKER_POLICIES.SAMPLING}" then
        return SamplingBreaker(settings)
    end
end

${circuitBreakerPolicyLua}
${circuitBreakerStorageLua}
${circuitBreakerStateManagerLua}
${circuitBreakerLua}

-- @param backoff Required<BackoffSettingsEnum>
-- @param policy Required<CircuitBreakerPolicySettingsEnum>
-- @param currentDate number
-- @return ICircuitBreakerAdapter
local function circuitBreakerFactory(backoffSettings, policySettings, currentDate)
    local policy = InternalCircuitBreakerPolicy(circuitBreakerPolicyFactory(policySettings))
    local storage = CircuitBreakerStorage(policy, currentDate)
    local backoff = backoffPolicyFactory(backoffSettings)
    local stateManager = CircuitBreakerStateManager(policy, backoff)
    return CircuitBreaker(storage, stateManager)
end
`;
