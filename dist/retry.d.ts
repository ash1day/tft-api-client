export interface RetryConfig {
    /** Maximum number of attempts (default: 3) */
    maxAttempts?: number;
    /** Base delay in ms for exponential backoff (default: 1000) */
    baseDelayMs?: number;
    /** Maximum delay in ms (default: 30000) */
    maxDelayMs?: number;
    /** Custom predicate to determine if error is retryable */
    retryOn?: (error: unknown) => boolean;
}
export declare function withRetry<T>(fn: () => Promise<T>, config?: RetryConfig): Promise<T>;
//# sourceMappingURL=retry.d.ts.map