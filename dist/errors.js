export class RateLimitError extends Error {
    retryAfterMs;
    constructor(message, retryAfterMs) {
        super(message);
        this.name = 'RateLimitError';
        this.retryAfterMs = retryAfterMs;
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