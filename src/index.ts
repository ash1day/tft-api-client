// Core client
export { TftClient } from './client.js'
export type { TftClientConfig, RequestExecutor, BatchExecutor } from './client.js'

// Rate limiter
export { RateLimiter } from './rate-limiter.js'
export type { RateLimitConfig, BucketStatus } from './rate-limiter.js'

// Retry
export { withRetry } from './retry.js'
export type { RetryConfig } from './retry.js'

// Errors
export { RateLimitError, ApiError } from './errors.js'

// Regions
export { getRegionGroup, getRegionalHost, getRegionGroupHost } from './regions.js'

// Types and constants
export {
  Regions,
  RegionGroups,
  RegionToGroup,
  Tiers,
  TFT_QUEUE_ID,
} from './types.js'
export type {
  Region,
  RegionGroup,
  Tier,
  MatchData,
  ParticipantData,
  TraitData,
  UnitData,
} from './types.js'

// API sub-module types
export { LeagueApi } from './api/league.js'
export { MatchApi } from './api/match.js'
export type { MatchListOptions } from './api/match.js'
export { SummonerApi } from './api/summoner.js'
export type {
  Division,
  LeagueListDTO,
  LeagueItemDTO,
  LeagueEntryDTO,
  MiniSeriesDTO,
  SummonerDTO,
  MatchDTO,
  MatchMetadataDTO,
  MatchInfoDTO,
  MatchParticipantDTO,
  MatchTraitDTO,
  MatchUnitDTO,
} from './api/types.js'
