export declare class RateLimitError extends Error {
    readonly retryAfterMs?: number | undefined;
    readonly body?: unknown | undefined;
    constructor(message: string, retryAfterMs?: number | undefined, body?: unknown | undefined);
}
export declare class ApiError extends Error {
    readonly status: number;
    readonly body?: unknown;
    constructor(message: string, status: number, body?: unknown);
}
//# sourceMappingURL=errors.d.ts.map