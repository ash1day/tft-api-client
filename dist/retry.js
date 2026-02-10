import { RateLimitError } from './errors.js';
import { sleep } from './utils.js';
const DEFAULT_CONFIG = {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    retryOn: () => true,
};
function isRetryableByDefault(error) {
    if (error instanceof RateLimitError)
        return true;
    // Retry on network errors and 5xx server errors
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes('fetch failed') ||
            message.includes('network') ||
            message.includes('econnreset') ||
            message.includes('etimedout') ||
            message.includes('socket hang up')) {
            return true;
        }
    }
    return false;
}
function computeDelay(attempt, config, error) {
    // Use Retry-After from RateLimitError if available
    if (error instanceof RateLimitError && error.retryAfterMs != null) {
        return Math.min(error.retryAfterMs, config.maxDelayMs);
    }
    // Exponential backoff: baseDelay * 2^attempt
    const exponentialDelay = config.baseDelayMs * 2 ** attempt;
    // Add jitter: random 0-500ms to prevent thundering herd
    const jitter = Math.random() * 500;
    return Math.min(exponentialDelay + jitter, config.maxDelayMs);
}
export async function withRetry(fn, config) {
    const resolvedConfig = { ...DEFAULT_CONFIG, ...config };
    let lastError;
    for (let attempt = 0; attempt < resolvedConfig.maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            const isLastAttempt = attempt === resolvedConfig.maxAttempts - 1;
            if (isLastAttempt)
                break;
            const shouldRetry = resolvedConfig.retryOn !== DEFAULT_CONFIG.retryOn
                ? resolvedConfig.retryOn(error)
                : isRetryableByDefault(error);
            if (!shouldRetry)
                break;
            const delay = computeDelay(attempt, resolvedConfig, error);
            await sleep(delay);
        }
    }
    throw lastError;
}
//# sourceMappingURL=retry.js.map