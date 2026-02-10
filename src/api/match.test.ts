import { describe, it, expect, vi } from 'vitest'
import { MatchApi } from './match.js'
import type { RequestExecutor, BatchExecutor } from '../client.js'
import type { MatchDTO } from './types.js'

describe('MatchApi', () => {
  function setup() {
    const exec: RequestExecutor = vi.fn().mockResolvedValue([])
    const batch: BatchExecutor = vi.fn().mockResolvedValue([])
    const api = new MatchApi(exec, batch)
    return {
      exec: exec as ReturnType<typeof vi.fn>,
      batch: batch as ReturnType<typeof vi.fn>,
      api,
    }
  }

  describe('list', () => {
    it('calls exec with bucket=match-list and correct URL', async () => {
      const { exec, api } = setup()
      await api.list('asia', 'puuid123')

      expect(exec).toHaveBeenCalledOnce()
      const [bucket, url] = exec.mock.calls[0]
      expect(bucket).toBe('match-list')
      expect(url).toContain('asia.api.riotgames.com')
      expect(url).toContain('/tft/match/v1/matches/by-puuid/puuid123/ids')
    })

    it('appends query params from options', async () => {
      const { exec, api } = setup()
      await api.list('asia', 'puuid123', { count: 20, startTime: 1000 })

      const [, url] = exec.mock.calls[0]
      expect(url).toContain('?count=20&startTime=1000')
    })

    it('does not append query string for empty options', async () => {
      const { exec, api } = setup()
      await api.list('asia', 'puuid123', {})

      const [, url] = exec.mock.calls[0]
      expect(url).not.toContain('?')
    })
  })

  describe('get', () => {
    it('calls exec with bucket=match-detail and correct URL', async () => {
      const { exec, api } = setup()
      await api.get('americas', 'NA1_123')

      expect(exec).toHaveBeenCalledOnce()
      const [bucket, url] = exec.mock.calls[0]
      expect(bucket).toBe('match-detail')
      expect(url).toContain('americas.api.riotgames.com')
      expect(url).toContain('/tft/match/v1/matches/NA1_123')
    })
  })

  describe('batchList', () => {
    it('calls batch with bucket=match-list and correct urlFn', async () => {
      const { batch, api } = setup()
      const testData = [['m1', 'm2'], ['m3']]
      batch.mockResolvedValue(testData)

      await api.batchList('asia', ['p1', 'p2'])

      expect(batch).toHaveBeenCalledOnce()
      const [bucket, keys, urlFn] = batch.mock.calls[0]
      expect(bucket).toBe('match-list')
      expect(keys).toEqual(['p1', 'p2'])

      // Verify the urlFn produces correct URLs for each key
      const url1 = urlFn('p1')
      const url2 = urlFn('p2')
      expect(url1).toContain('asia.api.riotgames.com')
      expect(url1).toContain('/tft/match/v1/matches/by-puuid/p1/ids')
      expect(url2).toContain('/tft/match/v1/matches/by-puuid/p2/ids')
    })

    it('returns a Map with correct key-value pairs', async () => {
      const { batch, api } = setup()
      const testData = [['m1', 'm2'], ['m3']]
      batch.mockResolvedValue(testData)

      const result = await api.batchList('asia', ['p1', 'p2'])

      expect(result).toBeInstanceOf(Map)
      expect(result.get('p1')).toEqual(['m1', 'm2'])
      expect(result.get('p2')).toEqual(['m3'])
    })
  })

  describe('batchGet', () => {
    it('calls batch with bucket=match-detail and correct urlFn', async () => {
      const { batch, api } = setup()
      const matchData: MatchDTO[] = [
        { metadata: { data_version: '1', match_id: 'm1', participants: [] }, info: {} as MatchDTO['info'] },
        { metadata: { data_version: '1', match_id: 'm2', participants: [] }, info: {} as MatchDTO['info'] },
      ]
      batch.mockResolvedValue(matchData)

      await api.batchGet('asia', ['m1', 'm2'])

      expect(batch).toHaveBeenCalledOnce()
      const [bucket, keys, urlFn] = batch.mock.calls[0]
      expect(bucket).toBe('match-detail')
      expect(keys).toEqual(['m1', 'm2'])

      // Verify the urlFn produces correct URLs for each key
      const url1 = urlFn('m1')
      const url2 = urlFn('m2')
      expect(url1).toContain('asia.api.riotgames.com')
      expect(url1).toContain('/tft/match/v1/matches/m1')
      expect(url2).toContain('/tft/match/v1/matches/m2')
    })

    it('returns a Map with correct key-value pairs', async () => {
      const { batch, api } = setup()
      const match1 = { metadata: { data_version: '1', match_id: 'm1', participants: [] }, info: {} as MatchDTO['info'] }
      const match2 = { metadata: { data_version: '1', match_id: 'm2', participants: [] }, info: {} as MatchDTO['info'] }
      batch.mockResolvedValue([match1, match2])

      const result = await api.batchGet('asia', ['m1', 'm2'])

      expect(result).toBeInstanceOf(Map)
      expect(result.get('m1')).toBe(match1)
      expect(result.get('m2')).toBe(match2)
    })
  })
})
