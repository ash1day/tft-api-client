/** Riot API platform routing values (regional servers) */
export declare const Regions: {
    readonly BRAZIL: "BR1";
    readonly EU_EAST: "EUN1";
    readonly EU_WEST: "EUW1";
    readonly JAPAN: "JP1";
    readonly KOREA: "KR";
    readonly LATIN_AMERICA_NORTH: "LA1";
    readonly LATIN_AMERICA_SOUTH: "LA2";
    readonly NORTH_AMERICA: "NA1";
    readonly OCEANIA: "OC1";
    readonly TURKEY: "TR1";
    readonly RUSSIA: "RU";
    readonly PBE: "PBE1";
    readonly VIETNAM: "VN2";
};
export type Region = (typeof Regions)[keyof typeof Regions];
/** Riot API regional routing values (for match/account endpoints) */
export declare const RegionGroups: {
    readonly AMERICAS: "americas";
    readonly EUROPE: "europe";
    readonly ASIA: "asia";
    readonly SEA: "sea";
};
export type RegionGroup = (typeof RegionGroups)[keyof typeof RegionGroups];
/** Map platform region to regional routing group */
export declare const RegionToGroup: Record<Region, RegionGroup>;
/** TFT ranked queue ID */
export declare const TFT_QUEUE_ID = 1100;
/** Ranked tier */
export declare const Tiers: {
    readonly CHALLENGER: "CHALLENGER";
    readonly GRANDMASTER: "GRANDMASTER";
    readonly MASTER: "MASTER";
    readonly DIAMOND: "DIAMOND";
    readonly EMERALD: "EMERALD";
    readonly PLATINUM: "PLATINUM";
    readonly GOLD: "GOLD";
    readonly SILVER: "SILVER";
    readonly BRONZE: "BRONZE";
    readonly IRON: "IRON";
};
export type Tier = (typeof Tiers)[keyof typeof Tiers];
/** Tiers that have divisions (Diamond and below) */
export type LowerTier = 'DIAMOND' | 'EMERALD' | 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'IRON';
//# sourceMappingURL=types.d.ts.map