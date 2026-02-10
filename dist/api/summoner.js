import { getRegionalHost } from '../regions.js';
export class SummonerApi {
    exec;
    constructor(exec) {
        this.exec = exec;
    }
    /** Get summoner by PUUID */
    async getByPuuid(region, puuid) {
        const host = getRegionalHost(region);
        return this.exec('summoner', `${host}/tft/summoner/v1/summoners/by-puuid/${puuid}`);
    }
}
//# sourceMappingURL=summoner.js.map