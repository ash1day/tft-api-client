import type { Region, RegionGroup } from './types.js'
import { RegionToGroup } from './types.js'

/** Get the regional routing group for a platform region */
export function getRegionGroup(region: Region): RegionGroup {
  return RegionToGroup[region]
}

/** Get the platform-specific API host URL */
export function getRegionalHost(region: Region): string {
  return `https://${region.toLowerCase()}.api.riotgames.com`
}

/** Get the regional routing host URL (for match/account endpoints) */
export function getRegionGroupHost(regionGroup: RegionGroup): string {
  return `https://${regionGroup}.api.riotgames.com`
}
