/** Division within a tier */
export type Division = 'I' | 'II' | 'III' | 'IV'

/** League list response from /tft/league/v1/{tier} */
export interface LeagueListDTO {
  tier: string
  leagueId: string
  queue: string
  name: string
  entries: LeagueItemDTO[]
}

export interface LeagueItemDTO {
  summonerId: string
  leaguePoints: number
  rank: string
  wins: number
  losses: number
  veteran: boolean
  inactive: boolean
  freshBlood: boolean
  hotStreak: boolean
}

/** League entry response from /tft/league/v1/entries/{tier}/{division} or /by-puuid/{puuid} */
export interface LeagueEntryDTO {
  leagueId: string
  summonerId: string
  puuid: string
  queueType: string
  tier: string
  rank: string
  leaguePoints: number
  wins: number
  losses: number
  hotStreak: boolean
  veteran: boolean
  freshBlood: boolean
  inactive: boolean
  miniSeries?: MiniSeriesDTO
}

export interface MiniSeriesDTO {
  losses: number
  progress: string
  target: number
  wins: number
}

/** Summoner response from /tft/summoner/v1/summoners/by-puuid/{puuid} */
export interface SummonerDTO {
  accountId: string
  profileIconId: number
  revisionDate: number
  id: string
  puuid: string
  summonerLevel: number
}

/** Match response from /tft/match/v1/matches/{matchId} */
export interface MatchDTO {
  metadata: MatchMetadataDTO
  info: MatchInfoDTO
}

export interface MatchMetadataDTO {
  data_version: string
  match_id: string
  participants: string[]
}

export interface MatchInfoDTO {
  game_datetime: number
  game_length: number
  game_version: string
  participants: MatchParticipantDTO[]
  queue_id: number
  tft_game_type: string
  tft_set_core_name: string
  tft_set_number: number
}

export interface MatchParticipantDTO {
  puuid: string
  placement: number
  level: number
  gold_left: number
  last_round: number
  time_eliminated: number
  traits: MatchTraitDTO[]
  units: MatchUnitDTO[]
  augments: string[]
  companion: {
    content_ID: string
    item_ID: number
    skin_ID: number
    species: string
  }
}

export interface MatchTraitDTO {
  name: string
  num_units: number
  style: number
  tier_current: number
  tier_total: number
}

export interface MatchUnitDTO {
  character_id: string
  itemNames: string[]
  items: number[]
  name: string
  rarity: number
  tier: number
}
