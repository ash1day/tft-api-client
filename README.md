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

Custom limits can be configured:

```typescript
const client = new TftClient({
  apiKey: '...',
  rateLimits: {
    'match-detail': { maxRequests: 100, windowMs: 10_000 },
  },
})
```

## API

### `TftClient`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | (required) | Riot API key |
| `bufferRate` | `number` | `0.9` | Usage ratio against rate limit (0-1) |
| `rateLimits` | `Record<string, RateLimitConfig>` | - | Custom limits per bucket |
| `retry` | `RetryConfig` | - | Retry configuration |

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

## Development

```bash
npm run build       # Build
npm run test        # Run tests
npm run typecheck   # Type check
```
