import type { Region } from '../types.js';
import type { LeagueListDTO, LeagueEntryDTO, Division } from './types.js';
import type { LowerTier } from '../types.js';
import type { RequestExecutor } from '../client.js';
export declare class LeagueApi {
    private readonly exec;
    constructor(exec: RequestExecutor);
    /** Get Challenger league entries */
    getChallengerLeague(region: Region): Promise<LeagueListDTO>;
    /** Get GrandMaster league entries */
    getGrandMasterLeague(region: Region): Promise<LeagueListDTO>;
    /** Get Master league entries */
    getMasterLeague(region: Region): Promise<LeagueListDTO>;
    /** Get league entries by tier and division (paginated) */
    getByTierDivision(region: Region, tier: LowerTier, division: Division, page?: number): Promise<LeagueEntryDTO[]>;
    /** Get league entries by encrypted summoner ID */
    getBySummoner(region: Region, summonerId: string): Promise<LeagueEntryDTO[]>;
}
//# sourceMappingURL=league.d.ts.map