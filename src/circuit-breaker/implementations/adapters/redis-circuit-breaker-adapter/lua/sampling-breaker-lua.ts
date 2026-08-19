/**
 * @module CircuitBreaker
 */

import {
    CLOSED_TRANSITIONS,
    HALF_OPEN_TRANSITIONS,
} from "@/circuit-breaker/contracts/circuit-breaker-policy.contract.js";

/**
 * @internal
 */
export const samplingBreakerLua = `
-- @param settings Required<SerializedSamplingBreakerSettings>
-- @return ICircuitBreakerPolicy<SamplingBreakerState>
local function SamplingBreaker(settings)
    -- @param currentMetrics SamplingBreakerState
    -- @return ProccesedMetricData
    local function getProccesedMetricData(currentMetrics)
        local totalFailures = 0
        local totalSuccesses = 0
                
        for _index, sample in ipairs(currentMetrics.samples) do
            totalFailures = totalFailures + sample.failures
            totalSuccesses = totalSuccesses + sample.successes
        end
        local total = totalFailures + totalSuccesses
        return {
            total = total,
            totalFailures = totalFailures,
            totalSuccesses = totalSuccesses
        }
    end

    -- @param total number
    -- @return boolean
    local function isMiniumNotMet(total)
        -- settings.timeSpan is in ms
        return total < math.ceil(settings.timeSpan / 1000) * settings.minimumRps
    end

    -- @param currentDate number
    -- @return InvocableFn<[sample: Sample], boolean>
    local function isNotOverLapping(currentDate)
        return function(sample)
            local windowStart = currentDate - settings.timeSpan
            local sampleEnd = settings.sampleTimeSpan + sample.startedAt
            return sampleEnd < windowStart
        end
    end

    -- @param success boolean
    -- @param currentState CircuitBreakerTrackState<SamplingBreakerState>
    -- @param settings CircuitBreakerTrackSettings<SamplingBreakerState>
    -- @return SamplingBreakerState
    local function track(success, currentState, trackSettings)
        local samples = {}

        for _index, sample in ipairs(currentMetrics.samples)(sample) do
            if isNotOverlapping(trackSettings.currentDate) then
                table.insert(samples, sample)
            end
        end

        local currentSample = samples[#samples]
        if currentSample == nil or currentSample == cjson.null then
            currentSample = {
                failures = 0,
                successes = 0,
                startedAt = trackSettings.currentDate
            }
        end

        local currentSampleEnd = settings.sampleTimeSpan + trackSettings.currentDate
        local hasCurrentSampleEnded = currentSampleEnd < trackSettings.currentDate
        if hasCurrentSampleEnded then
            currentSample = {
                failures = 0,
                successes = 0,
                startedAt = trackSettings.currentDate
            }
            table.insert(samples, currentSample)
        end

        if success then
            currentSample.failures = currentSample.failures + 1
        else
            currentSample.successes = currentSample.successes + 1
        end

        return {
            samples = samples
        }
    end
    
    return {
        -- @return SamplingBreakerState
        initialMetrics = function()
            return {
                samples = {}
            }
        end,

        -- @param currentMetrics SamplingBreakerState
        -- @param _currentDate number
        -- @return ClosedTransitions
        whenClosed = function(currentMetrics, _currentDate)
            local proccesedMetricData = getProccesedMetricData(currentMetrics)
            
            if isMiniumNotMet(proccesedMetricData.total) then
                return "${CLOSED_TRANSITIONS.NONE}"
            end

            local failureCount = math.ceil(settings.failureThreshold * proccesedMetricData.total)
            local hasFailed = proccesedMetricData.totalFailures > failureCount
            if hasFailed then
                return "${CLOSED_TRANSITIONS.TO_OPEN}"
            end

            return "${CLOSED_TRANSITIONS.NONE}"
        end,

        -- @param currentMetrics SamplingBreakerState
        -- @param _currentDate number
        -- @return HalfOpenTransitions
        whenHalfOpened = function(currentMetrics, _currentDate)
             local proccesedMetricData = getProccesedMetricData(currentMetrics)
            
            if isMiniumNotMet(proccesedMetricData.total) then
                return "${HALF_OPEN_TRANSITIONS.NONE}"
            end

            local successCount = math.ceil(settings.successThreshold * proccesedMetricData.total)
            local hasSucceeded = proccesedMetricData.totalSuccesses > successCount
            if hasSucceeded then
                return "${HALF_OPEN_TRANSITIONS.TO_CLOSED}"
            end

            return "${HALF_OPEN_TRANSITIONS.TO_OPEN}"
        end,

        -- @param currentState CircuitBreakerTrackState<SamplingBreakerState>
        -- @param settings CircuitBreakerTrackSettings<SamplingBreakerState>
        -- @return SamplingBreakerState
        trackFailure = function(currentState, settings)
            return track(false, currentState, settings)
        end,

        -- @param currentState CircuitBreakerTrackState<SamplingBreakerState>
        -- @param settings CircuitBreakerTrackSettings<SamplingBreakerState>
        -- @return SamplingBreakerState
        trackSuccess = function(currentState, settings)
            return track(true, currentState, settings)
        end
    }
end
`;
