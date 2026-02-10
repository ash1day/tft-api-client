import type { RegionGroup } from '../types.js'
import type { MatchDTO } from './types.js'
import type { RequestExecutor, BatchExecutor } from '../client.js'
import { getRegionGroupHost } from '../regions.js'

export interface MatchListOptions {
  /** Number of match IDs to return (default 20, max 100) */
  count?: number
  /** Epoch seconds - filter matches after this time */
  startTime?: number
  /** Epoch seconds - filter matches before this time */
  endTime?: number
  /** Pagination offset (default 0) */
  start?: number
}

function buildMatchListParams(options?: MatchListOptions): string {
  if (!options) return ''
  const params = new URLSearchParams()
  if (options.count != null) params.set('count', String(options.count))
  if (options.startTime != null) params.set('startTime', String(options.startTime))
  if (options.endTime != null) params.set('endTime', String(options.endTime))
  if (options.start != null) params.set('start', String(options.start))
  const str = params.toString()
  return str ? `?${str}` : ''
}

export class MatchApi {
  constructor(
    private readonly exec: RequestExecutor,
    private readonly batch: BatchExecutor,
  ) {}

  /** Get a list of match IDs for a player */
  async list(
    regionGroup: RegionGroup,
    puuid: string,
    options?: MatchListOptions,
  ): Promise<string[]> {
    const host = getRegionGroupHost(regionGroup)
    const params = buildMatchListParams(options)
    return this.exec(
      'match-list',
      `${host}/tft/match/v1/matches/by-puuid/${puuid}/ids${params}`,
    )
  }

  /** Get match details by match ID */
  async get(regionGroup: RegionGroup, matchId: string): Promise<MatchDTO> {
    const host = getRegionGroupHost(regionGroup)
    return this.exec(
      'match-detail',
      `${host}/tft/match/v1/matches/${matchId}`,
    )
  }

  /** Batch fetch match IDs for multiple players */
  async batchList(
    regionGroup: RegionGroup,
    puuids: string[],
    options?: MatchListOptions,
  ): Promise<Map<string, string[]>> {
    const host = getRegionGroupHost(regionGroup)
    const params = buildMatchListParams(options)

    const results = await this.batch<string[], string>(
      'match-list',
      puuids,
      (puuid) => `${host}/tft/match/v1/matches/by-puuid/${puuid}/ids${params}`,
    )

    const map = new Map<string, string[]>()
    for (let i = 0; i < puuids.length; i++) {
      map.set(puuids[i], results[i])
    }
    return map
  }

  /** Batch fetch match details */
  async batchGet(
    regionGroup: RegionGroup,
    matchIds: string[],
  ): Promise<Map<string, MatchDTO>> {
    const host = getRegionGroupHost(regionGroup)

    const results = await this.batch<MatchDTO, string>(
      'match-detail',
      matchIds,
      (matchId) => `${host}/tft/match/v1/matches/${matchId}`,
    )

    const map = new Map<string, MatchDTO>()
    for (let i = 0; i < matchIds.length; i++) {
      map.set(matchIds[i], results[i])
    }
    return map
  }
}
