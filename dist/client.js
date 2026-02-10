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
    constructor(config) {
        this.apiKey = config.apiKey;
        this.retryConfig = config.retry;
        // Merge user overrides with defaults, applying bufferRate
        const bufferRate = config.bufferRate ?? 0.9;
        const mergedLimits = {};
        for (const [name, defaults] of Object.entries(DEFAULT_RATE_LIMITS)) {
            const override = config.rateLimits?.[name];
            mergedLimits[name] = {
                maxRequests: override?.maxRequests ?? defaults.maxRequests,
                windowMs: override?.windowMs ?? defaults.windowMs,
                bufferRate: override?.bufferRate ?? bufferRate,
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
        return this.rateLimiter.execute(bucketName, () => withRetry(() => this.fetchJson(url), this.retryConfig));
    }
    async executeBatch(bucketName, keys, urlFn) {
        return this.rateLimiter.executeBatch(bucketName, keys, (key) => withRetry(() => this.fetchJson(urlFn(key)), this.retryConfig));
    }
    async fetchJson(url) {
        const response = await fetch(url, {
            headers: {
                'X-Riot-Token': this.apiKey,
                Accept: 'application/json',
            },
        });
        if (!response.ok) {
            // Handle rate limit responses specially
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After');
                const retryAfterMs = retryAfter ? Number(retryAfter) * 1000 : undefined;
                throw new RateLimitError(`Rate limited on ${url}`, retryAfterMs);
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
}
//# sourceMappingURL=client.js.map