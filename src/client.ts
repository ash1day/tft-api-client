import { RateLimiter } from './rate-limiter.js'
import type { RateLimitConfig } from './rate-limiter.js'
import { withRetry } from './retry.js'
import type { RetryConfig } from './retry.js'
import { ApiError, RateLimitError } from './errors.js'
import { LeagueApi } from './api/league.js'
import { MatchApi } from './api/match.js'
import { SummonerApi } from './api/summoner.js'

/**
 * Internal type for the request execution function shared with API modules.
 * Handles rate limiting, retries, and response parsing.
 */
export type RequestExecutor = <T>(bucketName: string, url: string) => Promise<T>

/**
 * Internal type for batch execution function shared with API modules.
 * Maps keys to URLs, rate-limits, and returns results.
 */
export type BatchExecutor = <T, K>(
  bucketName: string,
  keys: K[],
  urlFn: (key: K) => string,
) => Promise<T[]>

export interface TftClientConfig {
  /** Riot API key */
  apiKey: string
  /** Override default rate limits per bucket */
  rateLimits?: Partial<Record<string, RateLimitConfig>>
  /** Application-level rate limit (applies to all requests across buckets) */
  appRateLimit?: RateLimitConfig
  /** Default buffer rate for all buckets (0-1, default 0.9) */
  bufferRate?: number
  /** Retry configuration */
  retry?: RetryConfig
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number
}

/**
 * Default rate limits matching Riot's published API limits.
 * See: https://developer.riotgames.com/docs/portal#web-apis_rate-limiting
 *
 * These are per-method limits (not application-level).
 * The bufferRate is applied on top to stay safely under the limit.
 */
const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // ~270 requests per 60 seconds
  league: { maxRequests: 270, windowMs: 60_000 },
  // ~600 requests per 10 seconds
  'match-list': { maxRequests: 600, windowMs: 10_000 },
  // ~250 requests per 10 seconds
  'match-detail': { maxRequests: 250, windowMs: 10_000 },
  // ~1600 requests per 60 seconds
  summoner: { maxRequests: 1600, windowMs: 60_000 },
}

export class TftClient {
  readonly league: LeagueApi
  readonly match: MatchApi
  readonly summoner: SummonerApi

  private readonly rateLimiter: RateLimiter
  private readonly apiKey: string
  private readonly retryConfig: RetryConfig | undefined
  private readonly hasAppRateLimit: boolean
  private readonly timeout: number

  constructor(config: TftClientConfig) {
    if (!config.apiKey) {
      throw new Error('apiKey is required')
    }

    this.apiKey = config.apiKey
    this.retryConfig = config.retry
    this.timeout = config.timeout ?? 30_000

    // Merge user overrides with defaults, applying bufferRate
    const bufferRate = config.bufferRate ?? 0.9
    if (bufferRate <= 0 || bufferRate > 1) {
      throw new Error('bufferRate must be between 0 (exclusive) and 1 (inclusive)')
    }
    const mergedLimits: Record<string, RateLimitConfig> = {}
    for (const [name, defaults] of Object.entries(DEFAULT_RATE_LIMITS)) {
      const override = config.rateLimits?.[name]
      mergedLimits[name] = {
        maxRequests: override?.maxRequests ?? defaults.maxRequests,
        windowMs: override?.windowMs ?? defaults.windowMs,
        bufferRate: override?.bufferRate ?? bufferRate,
      }
    }

    // Add application-level rate limit bucket if configured
    this.hasAppRateLimit = config.appRateLimit != null
    if (config.appRateLimit) {
      mergedLimits['application'] = {
        ...config.appRateLimit,
        bufferRate: config.appRateLimit.bufferRate ?? bufferRate,
      }
    }

    this.rateLimiter = new RateLimiter(mergedLimits)

    // Create API sub-clients with bound executors
    const exec: RequestExecutor = (bucket, url) => this.executeRequest(bucket, url)
    const batch: BatchExecutor = (bucket, keys, urlFn) => this.executeBatch(bucket, keys, urlFn)

    this.league = new LeagueApi(exec)
    this.match = new MatchApi(exec, batch)
    this.summoner = new SummonerApi(exec)
  }

  private async executeRequest<T>(bucketName: string, url: string): Promise<T> {
    const fn = () => this.rateLimiter.execute(bucketName, () =>
      withRetry(() => this.fetchJson<T>(url), this.retryConfig),
    )
    if (this.hasAppRateLimit) {
      return this.rateLimiter.execute('application', fn)
    }
    return fn()
  }

  private async executeBatch<T, K>(
    bucketName: string,
    keys: K[],
    urlFn: (key: K) => string,
  ): Promise<T[]> {
    const fn = () => this.rateLimiter.executeBatch(bucketName, keys, (key) =>
      withRetry(() => this.fetchJson<T>(urlFn(key)), this.retryConfig),
    )
    if (this.hasAppRateLimit) {
      return this.rateLimiter.execute('application', fn)
    }
    return fn()
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      headers: {
        'X-Riot-Token': this.apiKey,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(this.timeout),
    })

    if (!response.ok) {
      // Handle rate limit responses specially
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        let retryAfterMs: number | undefined
        if (retryAfter) {
          const parsed = Number(retryAfter)
          retryAfterMs = Number.isNaN(parsed) ? undefined : parsed * 1000
        }
        let body: unknown
        try { body = await response.json() } catch { /* ignore */ }
        throw new RateLimitError(
          `Rate limited on ${url}`,
          retryAfterMs,
          body,
        )
      }

      let body: unknown
      try {
        body = await response.json()
      } catch {
        // body parsing failed, leave undefined
      }

      throw new ApiError(
        `API request failed: ${response.status} ${response.statusText}`,
        response.status,
        body,
      )
    }

    return (await response.json()) as T
  }

  destroy(): void {
    this.rateLimiter.destroy()
  }
}
