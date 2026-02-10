import { describe, it, expect } from 'vitest'
import { RateLimiter } from './rate-limiter.js'

describe('RateLimiter', () => {
  it('throws on unknown bucket', () => {
    const limiter = new RateLimiter({
      test: { maxRequests: 10, windowMs: 1000 },
    })
    expect(() => limiter.getStatus('unknown')).toThrow('Unknown rate limit bucket: "unknown"')
  })

  it('executes requests within limits immediately', async () => {
    const limiter = new RateLimiter({
      test: { maxRequests: 10, windowMs: 1000, bufferRate: 1.0 },
    })

    const result = await limiter.execute('test', async () => 42)
    expect(result).toBe(42)
  })

  it('reports correct bucket status', () => {
    const limiter = new RateLimiter({
      test: { maxRequests: 10, windowMs: 1000, bufferRate: 1.0 },
    })

    const status = limiter.getStatus('test')
    expect(status.available).toBe(10)
    expect(status.queued).toBe(0)
    expect(status.inFlight).toBe(0)
  })

  it('applies buffer rate to effective capacity', () => {
    const limiter = new RateLimiter({
      test: { maxRequests: 100, windowMs: 1000, bufferRate: 0.9 },
    })

    const status = limiter.getStatus('test')
    expect(status.available).toBe(90)
  })

  it('executeBatch processes all keys', async () => {
    const limiter = new RateLimiter({
      test: { maxRequests: 100, windowMs: 1000, bufferRate: 1.0 },
    })

    const keys = [1, 2, 3, 4, 5]
    const results = await limiter.executeBatch('test', keys, async (k) => k * 2)
    expect(results).toEqual([2, 4, 6, 8, 10])
  })

  it('executeBatch limits concurrency via worker count', async () => {
    const limiter = new RateLimiter({
      test: { maxRequests: 100, windowMs: 1000, bufferRate: 1.0 },
    })

    let maxConcurrent = 0
    let current = 0
    const keys = [1, 2, 3, 4, 5]

    await limiter.executeBatch(
      'test',
      keys,
      async (k) => {
        current++
        maxConcurrent = Math.max(maxConcurrent, current)
        // Small real delay to allow overlap detection
        await new Promise((r) => setTimeout(r, 5))
        current--
        return k
      },
      { concurrency: 2 },
    )

    expect(maxConcurrent).toBeLessThanOrEqual(2)
  })

  it('handles errors in executed functions', async () => {
    const limiter = new RateLimiter({
      test: { maxRequests: 10, windowMs: 1000, bufferRate: 1.0 },
    })

    await expect(
      limiter.execute('test', async () => {
        throw new Error('test error')
      }),
    ).rejects.toThrow('test error')
  })

  it('queues requests beyond capacity and drains over time', async () => {
    // Very small window so the test doesn't take long
    const limiter = new RateLimiter({
      test: { maxRequests: 2, windowMs: 50, bufferRate: 1.0 },
    })

    const order: number[] = []
    const promises = [1, 2, 3].map((n) =>
      limiter.execute('test', async () => {
        order.push(n)
        return n
      }),
    )

    const results = await Promise.all(promises)
    expect(results).toEqual([1, 2, 3])
    expect(order).toEqual([1, 2, 3])
  }, 10000)
})
