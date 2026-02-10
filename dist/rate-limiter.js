function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export class RateLimiter {
    buckets = new Map();
    constructor(configs) {
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
            });
        }
    }
    /** Execute a request under a specific bucket's rate limit */
    execute(bucketName, fn) {
        const bucket = this.getBucket(bucketName);
        return new Promise((resolve, reject) => {
            bucket.queue.push({
                fn: fn,
                resolve: resolve,
                reject,
            });
            this.drain(bucket);
        });
    }
    /** Execute multiple requests with automatic batching */
    async executeBatch(bucketName, keys, fn, options) {
        const concurrency = options?.concurrency ?? keys.length;
        const results = new Array(keys.length);
        let nextIndex = 0;
        const worker = async () => {
            while (nextIndex < keys.length) {
                const index = nextIndex++;
                results[index] = await this.execute(bucketName, () => fn(keys[index]));
            }
        };
        const workerCount = Math.min(concurrency, keys.length);
        const workers = Array.from({ length: workerCount }, () => worker());
        await Promise.all(workers);
        return results;
    }
    /** Get current state of a bucket */
    getStatus(bucketName) {
        const bucket = this.getBucket(bucketName);
        this.pruneTimestamps(bucket);
        const effectiveMax = Math.floor(bucket.config.maxRequests * bucket.config.bufferRate);
        const used = bucket.timestamps.length + bucket.inFlight;
        const available = Math.max(0, effectiveMax - used);
        return {
            available,
            queued: bucket.queue.length,
            inFlight: bucket.inFlight,
        };
    }
    getBucket(name) {
        const bucket = this.buckets.get(name);
        if (!bucket) {
            throw new Error(`Unknown rate limit bucket: "${name}"`);
        }
        return bucket;
    }
    /** Remove timestamps outside the current window */
    pruneTimestamps(bucket) {
        const cutoff = Date.now() - bucket.config.windowMs;
        // timestamps are in chronological order, find first valid index
        let firstValid = 0;
        while (firstValid < bucket.timestamps.length && bucket.timestamps[firstValid] <= cutoff) {
            firstValid++;
        }
        if (firstValid > 0) {
            bucket.timestamps.splice(0, firstValid);
        }
    }
    /** Calculate how many requests can be made right now */
    availableCapacity(bucket) {
        this.pruneTimestamps(bucket);
        const effectiveMax = Math.floor(bucket.config.maxRequests * bucket.config.bufferRate);
        const used = bucket.timestamps.length + bucket.inFlight;
        return Math.max(0, effectiveMax - used);
    }
    /** Calculate how long to wait until a slot opens up */
    waitTimeMs(bucket) {
        this.pruneTimestamps(bucket);
        if (bucket.timestamps.length === 0)
            return 0;
        // Wait until the oldest request exits the window
        const oldestTimestamp = bucket.timestamps[0];
        const expiresAt = oldestTimestamp + bucket.config.windowMs;
        const waitMs = expiresAt - Date.now();
        return Math.max(0, waitMs + 1); // +1ms safety margin
    }
    /** Process queued requests as capacity becomes available */
    async drain(bucket) {
        if (bucket.draining)
            return;
        bucket.draining = true;
        try {
            while (bucket.queue.length > 0) {
                const capacity = this.availableCapacity(bucket);
                if (capacity <= 0) {
                    const waitMs = this.waitTimeMs(bucket);
                    if (waitMs > 0) {
                        await sleep(waitMs);
                    }
                    continue;
                }
                // Process up to `capacity` items from the queue
                const batch = bucket.queue.splice(0, capacity);
                for (const item of batch) {
                    bucket.timestamps.push(Date.now());
                    bucket.inFlight++;
                    // Fire and don't await; resolution happens via item.resolve/reject
                    item
                        .fn()
                        .then((result) => {
                        item.resolve(result);
                    })
                        .catch((error) => {
                        item.reject(error);
                    })
                        .finally(() => {
                        bucket.inFlight--;
                        // Re-trigger drain in case there are more queued items
                        // that became unblocked when this request completed
                        if (bucket.queue.length > 0 && !bucket.draining) {
                            this.drain(bucket);
                        }
                    });
                }
                // If there are still items in the queue, wait for capacity
                if (bucket.queue.length > 0) {
                    const waitMs = this.waitTimeMs(bucket);
                    if (waitMs > 0) {
                        await sleep(waitMs);
                    }
                }
            }
        }
        finally {
            bucket.draining = false;
        }
    }
}
//# sourceMappingURL=rate-limiter.js.map