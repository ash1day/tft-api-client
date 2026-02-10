import { RateLimiter } from './rate-limiter.js';
import { withRetry } from './retry.js';
import { ApiError, RateLimitError } from './errors.js';
import { LeagueApi } from './api/league.js';
import { MatchApi } from './api/match.js';
import { SummonerApi } from './api/summoner.js';
/**
 * Default rate limits matching Riot's published API limits.
 * See: https://developer.riotgames.com/docs/portal#web-apis_rate-limiting
 *
 * These are per-method limits (not application-level).
 * The bufferRate is applied on top to stay safely under the limit.
 */
const DEFAULT_RATE_LIMITS = {
    // ~270 requests per 60 seconds
    league: { maxRequests: 270, windowMs: 60_000 },
    // ~600 requests per 10 seconds
    'match-list': { maxRequests: 600, windowMs: 10_000 },
    // ~250 requests per 10 seconds
    'match-detail': { maxRequests: 250, windowMs: 10_000 },
    // ~1600 requests per 60 seconds
    summoner: { maxRequests: 1600, windowMs: 60_000 },
};
export class TftClient {
    league;
    match;
    summoner;
    rateLimiter;
    apiKey;
    retryConfig;
    hasAppRateLimit;
    timeout;
    constructor(config) {
        if (!config.apiKey) {
            throw new Error('apiKey is required');
        }
        this.apiKey = config.apiKey;
        this.retryConfig = config.retry;
        this.timeout = config.timeout ?? 30_000;
        // Merge user overrides with defaults, applying bufferRate
        const bufferRate = config.bufferRate ?? 0.9;
        if (bufferRate <= 0 || bufferRate > 1) {
            throw new Error('bufferRate must be between 0 (exclusive) and 1 (inclusive)');
        }
        const mergedLimits = {};
        for (const [name, defaults] of Object.entries(DEFAULT_RATE_LIMITS)) {
            const override = config.rateLimits?.[name];
            mergedLimits[name] = {
                maxRequests: override?.maxRequests ?? defaults.maxRequests,
                windowMs: override?.windowMs ?? defaults.windowMs,
                bufferRate: override?.bufferRate ?? bufferRate,
            };
        }
        // Add application-level rate limit bucket if configured
        this.hasAppRateLimit = config.appRateLimit != null;
        if (config.appRateLimit) {
            mergedLimits['application'] = {
                ...config.appRateLimit,
                bufferRate: config.appRateLimit.bufferRate ?? bufferRate,
            };
        }
        this.rateLimiter = new RateLimiter(mergedLimits);
        // Create API sub-clients with bound executors
        const exec = (bucket, url) => this.executeRequest(bucket, url);
        const batch = (bucket, keys, urlFn) => this.executeBatch(bucket, keys, urlFn);
        this.league = new LeagueApi(exec);
        this.match = new MatchApi(exec, batch);
        this.summoner = new SummonerApi(exec);
    }
    async executeRequest(bucketName, url) {
        const fn = () => this.rateLimiter.execute(bucketName, () => withRetry(() => this.fetchJson(url), this.retryConfig));
        if (this.hasAppRateLimit) {
            return this.rateLimiter.execute('application', fn);
        }
        return fn();
    }
    async executeBatch(bucketName, keys, urlFn) {
        const fn = () => this.rateLimiter.executeBatch(bucketName, keys, (key) => withRetry(() => this.fetchJson(urlFn(key)), this.retryConfig));
        if (this.hasAppRateLimit) {
            return this.rateLimiter.execute('application', fn);
        }
        return fn();
    }
    async fetchJson(url) {
        const response = await fetch(url, {
            headers: {
                'X-Riot-Token': this.apiKey,
                Accept: 'application/json',
            },
            signal: AbortSignal.timeout(this.timeout),
        });
        if (!response.ok) {
            // Handle rate limit responses specially
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After');
                let retryAfterMs;
                if (retryAfter) {
                    const parsed = Number(retryAfter);
                    retryAfterMs = Number.isNaN(parsed) ? undefined : parsed * 1000;
                }
                let body;
                try {
                    body = await response.json();
                }
                catch { /* ignore */ }
                throw new RateLimitError(`Rate limited on ${url}`, retryAfterMs, body);
            }
            let body;
            try {
                body = await response.json();
            }
            catch {
                // body parsing failed, leave undefined
            }
            throw new ApiError(`API request failed: ${response.status} ${response.statusText}`, response.status, body);
        }
        return (await response.json());
    }
    destroy() {
        this.rateLimiter.destroy();
    }
}
//# sourceMappingURL=client.js.map