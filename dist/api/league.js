import { getRegionalHost } from '../regions.js';
export class LeagueApi {
    exec;
    constructor(exec) {
        this.exec = exec;
    }
    /** Get Challenger league entries */
    async getChallengerLeague(region) {
        const host = getRegionalHost(region);
        return this.exec('league', `${host}/tft/league/v1/challenger`);
    }
    /** Get GrandMaster league entries */
    async getGrandMasterLeague(region) {
        const host = getRegionalHost(region);
        return this.exec('league', `${host}/tft/league/v1/grandmaster`);
    }
    /** Get Master league entries */
    async getMasterLeague(region) {
        const host = getRegionalHost(region);
        return this.exec('league', `${host}/tft/league/v1/master`);
    }
    /** Get league entries by tier and division (paginated) */
    async getByTierDivision(region, tier, division, page) {
        const host = getRegionalHost(region);
        const params = page != null && page > 1 ? `?page=${page}` : '';
        return this.exec('league', `${host}/tft/league/v1/entries/${tier}/${division}${params}`);
    }
    /** Get league entries by encrypted PUUID */
    async getByPUUID(region, puuid) {
        const host = getRegionalHost(region);
        return this.exec('league', `${host}/tft/league/v1/entries/by-puuid/${puuid}`);
    }
}
//# sourceMappingURL=league.js.map