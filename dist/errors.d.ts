export declare class RateLimitError extends Error {
    readonly retryAfterMs?: number;
    constructor(message: string, retryAfterMs?: number);
}
export declare class ApiError extends Error {
    readonly status: number;
    readonly body?: unknown;
    constructor(message: string, status: number, body?: unknown);
}
//# sourceMappingURL=errors.d.ts.map