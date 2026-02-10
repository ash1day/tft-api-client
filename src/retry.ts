import { RateLimitError } from './errors.js'
import { sleep } from './utils.js'

export interface RetryConfig {
  /** Maximum number of attempts (default: 3) */
  maxAttempts?: number
  /** Base delay in ms for exponential backoff (default: 1000) */
  baseDelayMs?: number
  /** Maximum delay in ms (default: 30000) */
  maxDelayMs?: number
  /** Custom predicate to determine if error is retryable */
  retryOn?: (error: unknown) => boolean
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  retryOn: () => true,
}

function isRetryableByDefault(error: unknown): boolean {
  if (error instanceof RateLimitError) return true

  // Retry on network errors and 5xx server errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    if (
      message.includes('fetch failed') ||
      message.includes('network') ||
      message.includes('econnreset') ||
      message.includes('etimedout') ||
      message.includes('socket hang up')
    ) {
      return true
    }
  }

  return false
}

function computeDelay(attempt: number, config: Required<RetryConfig>, error: unknown): number {
  // Use Retry-After from RateLimitError if available
  if (error instanceof RateLimitError && error.retryAfterMs != null) {
    return Math.min(error.retryAfterMs, config.maxDelayMs)
  }

  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = config.baseDelayMs * 2 ** attempt

  // Add jitter: random 0-500ms to prevent thundering herd
  const jitter = Math.random() * 500

  return Math.min(exponentialDelay + jitter, config.maxDelayMs)
}

export async function withRetry<T>(fn: () => Promise<T>, config?: RetryConfig): Promise<T> {
  const resolvedConfig: Required<RetryConfig> = { ...DEFAULT_CONFIG, ...config }

  let lastError: unknown

  for (let attempt = 0; attempt < resolvedConfig.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      const isLastAttempt = attempt === resolvedConfig.maxAttempts - 1
      if (isLastAttempt) break

      const shouldRetry =
        resolvedConfig.retryOn !== DEFAULT_CONFIG.retryOn
          ? resolvedConfig.retryOn(error)
          : isRetryableByDefault(error)

      if (!shouldRetry) break

      const delay = computeDelay(attempt, resolvedConfig, error)
      await sleep(delay)
    }
  }

  throw lastError
}
