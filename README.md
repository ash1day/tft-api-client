# @tn/tft-api-client

Riot Games TFT API クライアント。エンドポイントごとのレートリミットを自動管理する。

## Install

```bash
# GitHub から直接
yarn add @tn/tft-api-client@github:ash1day/tft-api-client

# npm
npm install github:ash1day/tft-api-client
```

## Usage

```typescript
import { TftClient } from '@tn/tft-api-client'

const client = new TftClient({
  apiKey: process.env.RIOT_API_KEY!,
  bufferRate: 0.9,       // レートリミットの90%まで使用（デフォルト）
  retry: { maxAttempts: 3 },
})

// League API
const challengers = await client.league.getChallengerLeague('JP1')
const masters = await client.league.getMasterLeague('KR')
const entries = await client.league.getByTierDivision('NA1', 'DIAMOND', 'I')

// Match API
const matchIds = await client.match.list('asia', puuid, { count: 20, startTime })
const match = await client.match.get('asia', matchId)

// バッチ取得（レートリミット内で自動並列化）
const matchIdMap = await client.match.batchList('asia', puuids, { count: 100 })
const matchMap = await client.match.batchGet('asia', matchIds)

// Summoner API
const summoner = await client.summoner.getByPuuid('JP1', puuid)
```

## Rate Limits

Riot API の公式レートリミットに基づいたデフォルト値が設定済み。

| Bucket | Limit | Window |
|--------|-------|--------|
| `league` | 270 req | 60s |
| `match-list` | 600 req | 10s |
| `match-detail` | 250 req | 10s |
| `summoner` | 1600 req | 60s |

リクエストは自動的にキューイングされ、レートリミットの範囲内で順次実行される。429レスポンス時は `Retry-After` ヘッダーを尊重してリトライする。

カスタムリミットも設定可能:

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
| `apiKey` | `string` | (required) | Riot API キー |
| `bufferRate` | `number` | `0.9` | レートリミットに対する使用率 (0-1) |
| `rateLimits` | `Record<string, RateLimitConfig>` | - | バケットごとのカスタムリミット |
| `retry` | `RetryConfig` | - | リトライ設定 |

### `client.league`

- `getChallengerLeague(region)` - Challenger リーグ取得
- `getGrandMasterLeague(region)` - GrandMaster リーグ取得
- `getMasterLeague(region)` - Master リーグ取得
- `getByTierDivision(region, tier, division, page?)` - ティア・ディビジョン別取得

### `client.match`

- `list(regionGroup, puuid, options?)` - マッチID一覧取得
- `get(regionGroup, matchId)` - マッチ詳細取得
- `batchList(regionGroup, puuids, options?)` - 複数プレイヤーのマッチID一括取得
- `batchGet(regionGroup, matchIds)` - マッチ詳細一括取得

### `client.summoner`

- `getByPuuid(region, puuid)` - PUUID からサモナー情報取得

## Regions

```typescript
import { Regions, RegionGroups, RegionToGroup } from '@tn/tft-api-client'

// リージョン: JP1, KR, NA1, EUW1, EUN1, BR1, LA1, LA2, OC1, TR1, VN2
// リージョングループ: americas, europe, asia, sea

const group = RegionToGroup['JP1'] // 'asia'
```

## Development

```bash
npm run build       # ビルド
npm run test        # テスト実行
npm run typecheck   # 型チェック
```
