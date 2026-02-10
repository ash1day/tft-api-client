import type { RegionGroup } from '../types.js';
import type { MatchDTO } from './types.js';
import type { RequestExecutor, BatchExecutor } from '../client.js';
export interface MatchListOptions {
    /** Number of match IDs to return (default 20, max 100) */
    count?: number;
    /** Epoch seconds - filter matches after this time */
    startTime?: number;
    /** Epoch seconds - filter matches before this time */
    endTime?: number;
    /** Pagination offset (default 0) */
    start?: number;
}
export declare class MatchApi {
    private readonly exec;
    private readonly batch;
    constructor(exec: RequestExecutor, batch: BatchExecutor);
    /** Get a list of match IDs for a player */
    list(regionGroup: RegionGroup, puuid: string, options?: MatchListOptions): Promise<string[]>;
    /** Get match details by match ID */
    get(regionGroup: RegionGroup, matchId: string): Promise<MatchDTO>;
    /** Batch fetch match IDs for multiple players */
    batchList(regionGroup: RegionGroup, puuids: string[], options?: MatchListOptions): Promise<Map<string, string[]>>;
    /** Batch fetch match details */
    batchGet(regionGroup: RegionGroup, matchIds: string[]): Promise<Map<string, MatchDTO>>;
}
//# sourceMappingURL=match.d.ts.map