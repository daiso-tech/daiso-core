/**
 * @module RateLimiter
 */
import { BACKOFFS } from "@/backoff-policies/implementations/_module.js";
import { backoffsLua } from "@/backoff-policies/implementations/backoffs-lua.js";
import { fixedWindowLimiterLua } from "@/rate-limiter/implementations/adapters/redis-rate-limiter-adapter/lua/fixed-window-limiter-lua.js";
import { rateLimiterPolicyLua } from "@/rate-limiter/implementations/adapters/redis-rate-limiter-adapter/lua/internal-rate-limiter-policy-lua.js";
import { rateLimiterLua } from "@/rate-limiter/implementations/adapters/redis-rate-limiter-adapter/lua/rate-limiter-lua.js";
import { rateLimiterStateManagerLua } from "@/rate-limiter/implementations/adapters/redis-rate-limiter-adapter/lua/rate-limiter-state-manager-lua.js";
import { rateLimterStorageLua } from "@/rate-limiter/implementations/adapters/redis-rate-limiter-adapter/lua/rate-limiter-storage-lua.js";
import { slidingWindowLimiterLua } from "@/rate-limiter/implementations/adapters/redis-rate-limiter-adapter/lua/sliding-window-limiter-lua.js";
import { LIMITER_POLICIES } from "@/rate-limiter/implementations/policies/_module.js";

/**
 * @internal
 */
export const rateLimiterFactoryLua = `
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

${fixedWindowLimiterLua}
${slidingWindowLimiterLua}

-- @param settings Required<RateLimiterPolicySettingsEnum>
-- @return IRateLimiterPolicy
local function rateLimiterPolicyFactory(settings)
    if settings.type == "${LIMITER_POLICIES.FIXED_WINDOW}" then
        return FixedWindowLimiter(settings)
    end

    if settings.type == "${LIMITER_POLICIES.SLIDING_WINDOW}" then
        return SlidingWindowLimiter(settings)
    end
end

${rateLimiterPolicyLua}
${rateLimterStorageLua}
${rateLimiterStateManagerLua}
${rateLimiterLua}

-- @param backoff Required<BackoffSettingsEnum>
-- @param policy Required<RateLimiterPolicySettingsEnum>
-- @param currentDate number
-- @return IRateLimiterAdapter
local function rateLimiterFactory(backoffSettings, policySettings, currentDate)
    local rateLimiterPolicy = InternalRateLimiterPolicy(rateLimiterPolicyFactory(policySettings))
    local backoffPolicy = backoffPolicyFactory(backoffSettings)
    local storage = RateLimiterStorage(rateLimiterPolicy, backoffPolicy, currentDate)
    local stateManager = RateLimiterStateManager(rateLimiterPolicy, backoffPolicy)
    return RateLimiter(storage, stateManager, currentDate)
end
`;
