export class RateLimitError extends Error {
    retryAfterMs;
    body;
    constructor(message, retryAfterMs, body) {
        super(message);
        this.retryAfterMs = retryAfterMs;
        this.body = body;
        this.name = 'RateLimitError';
    }
}
export class ApiError extends Error {
    status;
    body;
    constructor(message, status, body) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.body = body;
    }
}
//# sourceMappingURL=errors.js.map