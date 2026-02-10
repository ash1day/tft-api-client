import type { Region } from '../types.js'
import type { SummonerDTO } from './types.js'
import type { RequestExecutor } from '../client.js'
import { getRegionalHost } from '../regions.js'

export class SummonerApi {
  constructor(private readonly exec: RequestExecutor) {}

  /** Get summoner by PUUID */
  async getByPuuid(region: Region, puuid: string): Promise<SummonerDTO> {
    const host = getRegionalHost(region)
    return this.exec(
      'summoner',
      `${host}/tft/summoner/v1/summoners/by-puuid/${puuid}`,
    )
  }
}
