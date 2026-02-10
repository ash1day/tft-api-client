import type { Region } from '../types.js';
import type { SummonerDTO } from './types.js';
import type { RequestExecutor } from '../client.js';
export declare class SummonerApi {
    private readonly exec;
    constructor(exec: RequestExecutor);
    /** Get summoner by PUUID */
    getByPuuid(region: Region, puuid: string): Promise<SummonerDTO>;
}
//# sourceMappingURL=summoner.d.ts.map