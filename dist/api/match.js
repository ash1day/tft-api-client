import { getRegionGroupHost } from '../regions.js';
function buildMatchListParams(options) {
    if (!options)
        return '';
    const params = new URLSearchParams();
    if (options.count != null)
        params.set('count', String(options.count));
    if (options.startTime != null)
        params.set('startTime', String(options.startTime));
    if (options.endTime != null)
        params.set('endTime', String(options.endTime));
    if (options.start != null)
        params.set('start', String(options.start));
    const str = params.toString();
    return str ? `?${str}` : '';
}
export class MatchApi {
    exec;
    batch;
    constructor(exec, batch) {
        this.exec = exec;
        this.batch = batch;
    }
    /** Get a list of match IDs for a player */
    async list(regionGroup, puuid, options) {
        const host = getRegionGroupHost(regionGroup);
        const params = buildMatchListParams(options);
        return this.exec('match-list', `${host}/tft/match/v1/matches/by-puuid/${puuid}/ids${params}`);
    }
    /** Get match details by match ID */
    async get(regionGroup, matchId) {
        const host = getRegionGroupHost(regionGroup);
        return this.exec('match-detail', `${host}/tft/match/v1/matches/${matchId}`);
    }
    /** Batch fetch match IDs for multiple players */
    async batchList(regionGroup, puuids, options) {
        const host = getRegionGroupHost(regionGroup);
        const params = buildMatchListParams(options);
        const results = await this.batch('match-list', puuids, (puuid) => `${host}/tft/match/v1/matches/by-puuid/${puuid}/ids${params}`);
        const map = new Map();
        for (let i = 0; i < puuids.length; i++) {
            map.set(puuids[i], results[i]);
        }
        return map;
    }
    /** Batch fetch match details */
    async batchGet(regionGroup, matchIds) {
        const host = getRegionGroupHost(regionGroup);
        const results = await this.batch('match-detail', matchIds, (matchId) => `${host}/tft/match/v1/matches/${matchId}`);
        const map = new Map();
        for (let i = 0; i < matchIds.length; i++) {
            map.set(matchIds[i], results[i]);
        }
        return map;
    }
}
//# sourceMappingURL=match.js.map