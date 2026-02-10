/** Riot API platform routing values (regional servers) */
export const Regions = {
  BRAZIL: 'BR1',
  EU_EAST: 'EUN1',
  EU_WEST: 'EUW1',
  JAPAN: 'JP1',
  KOREA: 'KR',
  LATIN_AMERICA_NORTH: 'LA1',
  LATIN_AMERICA_SOUTH: 'LA2',
  NORTH_AMERICA: 'NA1',
  OCEANIA: 'OC1',
  TURKEY: 'TR1',
  RUSSIA: 'RU',
  PBE: 'PBE1',
  VIETNAM: 'VN2',
} as const

export type Region = (typeof Regions)[keyof typeof Regions]

/** Riot API regional routing values (for match/account endpoints) */
export const RegionGroups = {
  AMERICAS: 'americas',
  EUROPE: 'europe',
  ASIA: 'asia',
  SEA: 'sea',
} as const

export type RegionGroup = (typeof RegionGroups)[keyof typeof RegionGroups]

/** Map platform region to regional routing group */
export const RegionToGroup: Record<Region, RegionGroup> = {
  BR1: RegionGroups.AMERICAS,
  EUN1: RegionGroups.EUROPE,
  EUW1: RegionGroups.EUROPE,
  JP1: RegionGroups.ASIA,
  KR: RegionGroups.ASIA,
  LA1: RegionGroups.AMERICAS,
  LA2: RegionGroups.AMERICAS,
  NA1: RegionGroups.AMERICAS,
  OC1: RegionGroups.SEA,
  TR1: RegionGroups.EUROPE,
  RU: RegionGroups.EUROPE,
  PBE1: RegionGroups.AMERICAS,
  VN2: RegionGroups.SEA,
}

/** TFT ranked queue ID */
export const TFT_QUEUE_ID = 1100

/** Ranked tier */
export const Tiers = {
  CHALLENGER: 'CHALLENGER',
  GRANDMASTER: 'GRANDMASTER',
  MASTER: 'MASTER',
  DIAMOND: 'DIAMOND',
  EMERALD: 'EMERALD',
  PLATINUM: 'PLATINUM',
  GOLD: 'GOLD',
  SILVER: 'SILVER',
  BRONZE: 'BRONZE',
  IRON: 'IRON',
} as const

export type Tier = (typeof Tiers)[keyof typeof Tiers]

/** Tiers that have divisions (Diamond and below) */
export type LowerTier = 'DIAMOND' | 'EMERALD' | 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'IRON'
