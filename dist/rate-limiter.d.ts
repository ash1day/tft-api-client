export interface RateLimitConfig {
    /** Max requests per window */
    maxRequests: number;
    /** Window size in milliseconds */
    windowMs: number;
    /** Safety buffer multiplier (0-1, default 0.9 = use 90% of actual limit) */
    bufferRate?: number;
}
export interface BucketStatus {
    /** Number of requests available right now */
    available: number;
    /** Number of requests waiting in queue */
    queued: number;
    /** Number of requests currently in-flight */
    inFlight: number;
}
export declare class RateLimiter {
    private readonly buckets;
    constructor(configs: Record<string, RateLimitConfig>);
    /** Execute a request under a specific bucket's rate limit */
    execute<T>(bucketName: string, fn: () => Promise<T>): Promise<T>;
    /** Execute multiple requests with automatic batching */
    executeBatch<T, K>(bucketName: string, keys: K[], fn: (key: K) => Promise<T>, options?: {
        concurrency?: number;
    }): Promise<T[]>;
    /** Get current state of a bucket */
    getStatus(bucketName: string): BucketStatus;
    private getBucket;
    /** Remove timestamps outside the current window */
    private pruneTimestamps;
    /** Calculate how many requests can be made right now */
    private availableCapacity;
    /** Calculate how long to wait until a slot opens up */
    private waitTimeMs;
    /** Process queued requests as capacity becomes available */
    private drain;
}
//# sourceMappingURL=rate-limiter.d.ts.map