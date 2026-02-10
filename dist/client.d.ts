import type { RateLimitConfig } from './rate-limiter.js';
import type { RetryConfig } from './retry.js';
import { LeagueApi } from './api/league.js';
import { MatchApi } from './api/match.js';
import { SummonerApi } from './api/summoner.js';
/**
 * Internal type for the request execution function shared with API modules.
 * Handles rate limiting, retries, and response parsing.
 */
export type RequestExecutor = <T>(bucketName: string, url: string) => Promise<T>;
/**
 * Internal type for batch execution function shared with API modules.
 * Maps keys to URLs, rate-limits, and returns results.
 */
export type BatchExecutor = <T, K>(bucketName: string, keys: K[], urlFn: (key: K) => string) => Promise<T[]>;
export interface TftClientConfig {
    /** Riot API key */
    apiKey: string;
    /** Override default rate limits per bucket */
    rateLimits?: Partial<Record<string, RateLimitConfig>>;
    /** Default buffer rate for all buckets (0-1, default 0.9) */
    bufferRate?: number;
    /** Retry configuration */
    retry?: RetryConfig;
}
export declare class TftClient {
    readonly league: LeagueApi;
    readonly match: MatchApi;
    readonly summoner: SummonerApi;
    private readonly rateLimiter;
    private readonly apiKey;
    private readonly retryConfig;
    constructor(config: TftClientConfig);
    private executeRequest;
    private executeBatch;
    private fetchJson;
}
//# sourceMappingURL=client.d.ts.map