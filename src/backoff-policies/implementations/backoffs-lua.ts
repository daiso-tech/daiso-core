/**
 * @module CircuitBreaker
 */

/**
 * @internal
 */
export const backoffsLua = `
-- @param args WithJitterArgs
-- @return number
local function withJitter(args)
    if args.jitter ~= nil and args.jitter ~= cjson.null then
        return (1 - args.jitter * args.mathRandom) * args.value
    end

    return args.value
end

-- @param settings Required<SerializedConstantBackoffSettings>
-- @return BackoffPolicy
local function constantBackoff(settings)
    -- @param _attempt number
    -- @return number
    return function(_attempt)
        return withJitter({
            jitter = settings.jitter,
            value = settings.delay,
            mathRandom = settings._mathRandom,
        })
    end
end

-- @param settings Required<SerializedExponentialBackoffSettings>
-- @return BackoffPolicy
local function exponentialBackoff(settings)
    -- @param attempt number
    -- @return number
    return function(attempt)
        local exponential = math.min(settings.maxDelay, settings.minDelay, math.pow(settings.multiplier, attempt))
        return withJitter({
            jitter = settings.jitter,
            value = exponential,
            mathRandom = settings._mathRandom,
        })
    end
end

-- @param settings Required<SerializedLinearBackoffSettings>
-- @return BackoffPolicy
local function linearBackoff(settings)
    -- @param attempt number
    -- @return number
    return function(attempt)
        local linear = math.min(settings.maxDelay, settings.minDelay * attempt)
        return withJitter({
            jitter = settings.jitter,
            value = linear,
            mathRandom = settings._mathRandom,
        })
    end
end


-- @param settings Required<SerializedPolynomialBackoffSettings>
-- @return BackoffPolicy
local function polynomialBackoff(settings)
    -- @param attempt number
    -- @return number
    return function(attempt)
        local polynomial = math.min(settings.maxDelay, settings.minDelay * math.pow(attempt, settings.degree))
        return withJitter({
            jitter = settings.jitter,
            value = polynomial,
            mathRandom = settings._mathRandom,
        })
    end
end
`;
