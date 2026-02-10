import type { Region, RegionGroup } from './types.js';
/** Get the regional routing group for a platform region */
export declare function getRegionGroup(region: Region): RegionGroup;
/** Get the platform-specific API host URL */
export declare function getRegionalHost(region: Region): string;
/** Get the regional routing host URL (for match/account endpoints) */
export declare function getRegionGroupHost(regionGroup: RegionGroup): string;
//# sourceMappingURL=regions.d.ts.map