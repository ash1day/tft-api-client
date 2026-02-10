# tft-api-client

Riot Games TFT API client with automatic per-endpoint rate limiting.

## Install

```bash
yarn add tft-api-client@github:ash1day/tft-api-client

npm install github:ash1day/tft-api-client
```

## Usage

```typescript
import { TftClient } from 'tft-api-client'

const client = new TftClient({
  apiKey: process.env.RIOT_API_KEY!,
  bufferRate: 0.9,       // use 90% of rate limit (default)
  retry: { maxAttempts: 3 },
})

// League API
const challengers = await client.league.getChallengerLeague('JP1')
const masters = await client.league.getMasterLeague('KR')
const entries = await client.league.getByTierDivision('NA1', 'DIAMOND', 'I')

// Match API
const matchIds = await client.match.list('asia', puuid, { count: 20, startTime })
const match = await client.match.get('asia', matchId)

// Batch requests (automatically parallelized within rate limits)
const matchIdMap = await client.match.batchList('asia', puuids, { count: 100 })
const matchMap = await client.match.batchGet('asia', matchIds)

// Summoner API
const summoner = await client.summoner.getByPuuid('JP1', puuid)
```

## Rate Limits

Preconfigured defaults based on Riot's published API limits.

| Bucket | Limit | Window |
|--------|-------|--------|
| `league` | 270 req | 60s |
| `match-list` | 600 req | 10s |
| `match-detail` | 250 req | 10s |
| `summoner` | 1600 req | 60s |

Requests are automatically queued and executed within rate limits. On 429 responses, the `Retry-After` header is respected.

> **Note**: Default limits are for production API keys. Development keys have stricter application-level limits (20 req/s, 100 req/2min). Use `appRateLimit` to configure:

```typescript
const client = new TftClient({
  apiKey: '...',
  appRateLimit: { maxRequests: 20, windowMs: 1_000 },
})
```

Custom limits can be configured:

```typescript
const client = new TftClient({
  apiKey: '...',
  rateLimits: {
    'match-detail': { maxRequests: 100, windowMs: 10_000 },
  },
})
```

## Error Handling

The library throws two error types:

```typescript
import { ApiError, RateLimitError } from 'tft-api-client'

try {
  const match = await client.match.get('asia', matchId)
} catch (error) {
  if (error instanceof RateLimitError) {
    // 429 response — automatically retried if retry is configured
    console.log(error.retryAfterMs) // ms to wait (from Retry-After header)
  } else if (error instanceof ApiError) {
    // Non-2xx response
    console.log(error.status) // HTTP status code
    console.log(error.body)   // Response body if available
  }
}
```

Requests timeout after 30 seconds by default. Configure with `timeout` option:

```typescript
const client = new TftClient({
  apiKey: '...',
  timeout: 10_000, // 10 seconds
})
```

## API

### `TftClient`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | (required) | Riot API key |
| `bufferRate` | `number` | `0.9` | Usage ratio against rate limit (0-1) |
| `rateLimits` | `Record<string, RateLimitConfig>` | - | Custom limits per bucket |
| `appRateLimit` | `RateLimitConfig` | - | Application-level rate limit across all buckets |
| `retry` | `RetryConfig` | - | Retry configuration |
| `timeout` | `number` | `30000` | Request timeout in milliseconds |

### `client.league`

- `getChallengerLeague(region)` - Get Challenger league entries
- `getGrandMasterLeague(region)` - Get GrandMaster league entries
- `getMasterLeague(region)` - Get Master league entries
- `getByTierDivision(region, tier, division, page?)` - Get entries by tier and division

### `client.match`

- `list(regionGroup, puuid, options?)` - Get match ID list
- `get(regionGroup, matchId)` - Get match details
- `batchList(regionGroup, puuids, options?)` - Batch fetch match IDs for multiple players
- `batchGet(regionGroup, matchIds)` - Batch fetch match details

### `client.summoner`

- `getByPuuid(region, puuid)` - Get summoner by PUUID

## Regions

```typescript
import { Regions, RegionGroups, RegionToGroup } from 'tft-api-client'

// Regions: JP1, KR, NA1, EUW1, EUN1, BR1, LA1, LA2, OC1, TR1, VN2
// Region groups: americas, europe, asia, sea

const group = RegionToGroup['JP1'] // 'asia'
```

## Cleanup

Call `destroy()` to cancel pending requests and release resources:

```typescript
client.destroy()
```

## Development

```bash
npm run build       # Build
npm run test        # Run tests
npm run typecheck   # Type check
```
