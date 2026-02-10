import { describe, it, expect } from 'vitest'
import { withRetry } from './retry.js'
import { RateLimitError } from './errors.js'

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const result = await withRetry(async () => 42)
    expect(result).toBe(42)
  })

  it('retries on RateLimitError and succeeds', async () => {
    let attempt = 0
    const result = await withRetry(
      async () => {
        attempt++
        if (attempt < 2) throw new RateLimitError('rate limited')
        return 'ok'
      },
      { maxAttempts: 3, baseDelayMs: 10 },
    )

    expect(result).toBe('ok')
    expect(attempt).toBe(2)
  })

  it('throws after max attempts exhausted', async () => {
    await expect(
      withRetry(
        async () => {
          throw new RateLimitError('always fails')
        },
        { maxAttempts: 2, baseDelayMs: 10, maxDelayMs: 50 },
      ),
    ).rejects.toThrow('always fails')
  })

  it('does not retry non-retryable errors by default', async () => {
    let attempt = 0
    await expect(
      withRetry(
        async () => {
          attempt++
          throw new Error('non-retryable')
        },
        { maxAttempts: 3, baseDelayMs: 10 },
      ),
    ).rejects.toThrow('non-retryable')
    expect(attempt).toBe(1)
  })

  it('uses retryAfterMs from RateLimitError', async () => {
    let attempt = 0
    const start = Date.now()

    const result = await withRetry(
      async () => {
        attempt++
        if (attempt < 2) throw new RateLimitError('rate limited', 100)
        return 'ok'
      },
      { maxAttempts: 3, baseDelayMs: 10 },
    )

    const elapsed = Date.now() - start
    expect(result).toBe('ok')
    // Should have waited at least ~100ms (the retryAfterMs)
    expect(elapsed).toBeGreaterThanOrEqual(80)
  })

  it('respects custom retryOn predicate', async () => {
    let attempt = 0
    await expect(
      withRetry(
        async () => {
          attempt++
          throw new Error('custom error')
        },
        {
          maxAttempts: 3,
          baseDelayMs: 10,
          maxDelayMs: 50,
          retryOn: (err) => err instanceof Error && err.message === 'custom error',
        },
      ),
    ).rejects.toThrow('custom error')
    expect(attempt).toBe(3)
  })
})
