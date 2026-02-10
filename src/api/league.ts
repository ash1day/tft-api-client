import type { Region } from '../types.js'
import type { LeagueListDTO, LeagueEntryDTO, Division } from './types.js'
import type { LowerTier } from '../types.js'
import type { RequestExecutor } from '../client.js'
import { getRegionalHost } from '../regions.js'

export class LeagueApi {
  constructor(private readonly exec: RequestExecutor) {}

  /** Get Challenger league entries */
  async getChallengerLeague(region: Region): Promise<LeagueListDTO> {
    const host = getRegionalHost(region)
    return this.exec('league', `${host}/tft/league/v1/challenger`)
  }

  /** Get GrandMaster league entries */
  async getGrandMasterLeague(region: Region): Promise<LeagueListDTO> {
    const host = getRegionalHost(region)
    return this.exec('league', `${host}/tft/league/v1/grandmaster`)
  }

  /** Get Master league entries */
  async getMasterLeague(region: Region): Promise<LeagueListDTO> {
    const host = getRegionalHost(region)
    return this.exec('league', `${host}/tft/league/v1/master`)
  }

  /** Get league entries by tier and division (paginated) */
  async getByTierDivision(
    region: Region,
    tier: LowerTier,
    division: Division,
    page?: number,
  ): Promise<LeagueEntryDTO[]> {
    const host = getRegionalHost(region)
    const params = page != null && page > 1 ? `?page=${page}` : ''
    return this.exec(
      'league',
      `${host}/tft/league/v1/entries/${tier}/${division}${params}`,
    )
  }
}
