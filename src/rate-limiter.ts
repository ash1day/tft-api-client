export interface RateLimitConfig {
  /** Max requests per window */
  maxRequests: number
  /** Window size in milliseconds */
  windowMs: number
  /** Safety buffer multiplier (0-1, default 0.9 = use 90% of actual limit) */
  bufferRate?: number
}

export interface BucketStatus {
  /** Number of requests available right now */
  available: number
  /** Number of requests waiting in queue */
  queued: number
  /** Number of requests currently in-flight */
  inFlight: number
}

interface QueueItem<T> {
  fn: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: unknown) => void
}

interface Bucket {
  config: Required<RateLimitConfig>
  /** Timestamps of requests within the current window */
  timestamps: number[]
  /** Pending requests waiting for capacity */
  queue: QueueItem<unknown>[]
  /** Number of in-flight requests */
  inFlight: number
  /** Whether the drain loop is actively processing */
  draining: boolean
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>()

  constructor(configs: Record<string, RateLimitConfig>) {
    for (const [name, config] of Object.entries(configs)) {
      this.buckets.set(name, {
        config: {
          maxRequests: config.maxRequests,
          windowMs: config.windowMs,
          bufferRate: config.bufferRate ?? 0.9,
        },
        timestamps: [],
        queue: [],
        inFlight: 0,
        draining: false,
      })
    }
  }

  /** Execute a request under a specific bucket's rate limit */
  execute<T>(bucketName: string, fn: () => Promise<T>): Promise<T> {
    const bucket = this.getBucket(bucketName)

    return new Promise<T>((resolve, reject) => {
      bucket.queue.push({
        fn: fn as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      })
      this.drain(bucket)
    })
  }

  /** Execute multiple requests with automatic batching */
  async executeBatch<T, K>(
    bucketName: string,
    keys: K[],
    fn: (key: K) => Promise<T>,
    options?: { concurrency?: number },
  ): Promise<T[]> {
    const concurrency = options?.concurrency ?? keys.length
    const results: T[] = new Array(keys.length)
    let nextIndex = 0

    const worker = async (): Promise<void> => {
      while (nextIndex < keys.length) {
        const index = nextIndex++
        results[index] = await this.execute(bucketName, () => fn(keys[index]))
      }
    }

    const workerCount = Math.min(concurrency, keys.length)
    const workers = Array.from({ length: workerCount }, () => worker())
    await Promise.all(workers)

    return results
  }

  /** Get current state of a bucket */
  getStatus(bucketName: string): BucketStatus {
    const bucket = this.getBucket(bucketName)
    this.pruneTimestamps(bucket)

    const effectiveMax = Math.floor(bucket.config.maxRequests * bucket.config.bufferRate)
    const used = bucket.timestamps.length + bucket.inFlight
    const available = Math.max(0, effectiveMax - used)

    return {
      available,
      queued: bucket.queue.length,
      inFlight: bucket.inFlight,
    }
  }

  private getBucket(name: string): Bucket {
    const bucket = this.buckets.get(name)
    if (!bucket) {
      throw new Error(`Unknown rate limit bucket: "${name}"`)
    }
    return bucket
  }

  /** Remove timestamps outside the current window */
  private pruneTimestamps(bucket: Bucket): void {
    const cutoff = Date.now() - bucket.config.windowMs
    // timestamps are in chronological order, find first valid index
    let firstValid = 0
    while (firstValid < bucket.timestamps.length && bucket.timestamps[firstValid] <= cutoff) {
      firstValid++
    }
    if (firstValid > 0) {
      bucket.timestamps.splice(0, firstValid)
    }
  }

  /** Calculate how many requests can be made right now */
  private availableCapacity(bucket: Bucket): number {
    this.pruneTimestamps(bucket)
    const effectiveMax = Math.floor(bucket.config.maxRequests * bucket.config.bufferRate)
    const used = bucket.timestamps.length + bucket.inFlight
    return Math.max(0, effectiveMax - used)
  }

  /** Calculate how long to wait until a slot opens up */
  private waitTimeMs(bucket: Bucket): number {
    this.pruneTimestamps(bucket)
    if (bucket.timestamps.length === 0) return 0

    // Wait until the oldest request exits the window
    const oldestTimestamp = bucket.timestamps[0]
    const expiresAt = oldestTimestamp + bucket.config.windowMs
    const waitMs = expiresAt - Date.now()
    return Math.max(0, waitMs + 1) // +1ms safety margin
  }

  /** Process queued requests as capacity becomes available */
  private async drain(bucket: Bucket): Promise<void> {
    if (bucket.draining) return
    bucket.draining = true

    try {
      while (bucket.queue.length > 0) {
        const capacity = this.availableCapacity(bucket)

        if (capacity <= 0) {
          const waitMs = this.waitTimeMs(bucket)
          if (waitMs > 0) {
            await sleep(waitMs)
          }
          continue
        }

        // Process up to `capacity` items from the queue
        const batch = bucket.queue.splice(0, capacity)

        for (const item of batch) {
          bucket.timestamps.push(Date.now())
          bucket.inFlight++

          // Fire and don't await; resolution happens via item.resolve/reject
          item
            .fn()
            .then((result) => {
              item.resolve(result)
            })
            .catch((error: unknown) => {
              item.reject(error)
            })
            .finally(() => {
              bucket.inFlight--
              // Re-trigger drain in case there are more queued items
              // that became unblocked when this request completed
              if (bucket.queue.length > 0 && !bucket.draining) {
                this.drain(bucket)
              }
            })
        }

        // If there are still items in the queue, wait for capacity
        if (bucket.queue.length > 0) {
          const waitMs = this.waitTimeMs(bucket)
          if (waitMs > 0) {
            await sleep(waitMs)
          }
        }
      }
    } finally {
      bucket.draining = false
    }
  }
}
