import { RegionToGroup } from './types.js';
/** Get the regional routing group for a platform region */
export function getRegionGroup(region) {
    return RegionToGroup[region];
}
/** Get the platform-specific API host URL */
export function getRegionalHost(region) {
    return `https://${region.toLowerCase()}.api.riotgames.com`;
}
/** Get the regional routing host URL (for match/account endpoints) */
export function getRegionGroupHost(regionGroup) {
    return `https://${regionGroup}.api.riotgames.com`;
}
//# sourceMappingURL=regions.js.map