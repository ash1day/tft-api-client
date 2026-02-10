import { describe, it, expect, vi } from 'vitest'
import { LeagueApi } from './league.js'
import type { RequestExecutor } from '../client.js'

describe('LeagueApi', () => {
  function setup() {
    const exec: RequestExecutor = vi.fn().mockResolvedValue({})
    const api = new LeagueApi(exec)
    return { exec: exec as ReturnType<typeof vi.fn>, api }
  }

  describe('getChallengerLeague', () => {
    it('calls exec with bucket=league and correct URL for JP1', async () => {
      const { exec, api } = setup()
      await api.getChallengerLeague('JP1')

      expect(exec).toHaveBeenCalledOnce()
      const [bucket, url] = exec.mock.calls[0]
      expect(bucket).toBe('league')
      expect(url).toContain('jp1.api.riotgames.com')
      expect(url).toContain('/tft/league/v1/challenger')
    })
  })

  describe('getGrandMasterLeague', () => {
    it('calls exec with bucket=league and correct URL for KR', async () => {
      const { exec, api } = setup()
      await api.getGrandMasterLeague('KR')

      expect(exec).toHaveBeenCalledOnce()
      const [bucket, url] = exec.mock.calls[0]
      expect(bucket).toBe('league')
      expect(url).toContain('kr.api.riotgames.com')
      expect(url).toContain('/tft/league/v1/grandmaster')
    })
  })

  describe('getMasterLeague', () => {
    it('calls exec with bucket=league and correct URL for NA1', async () => {
      const { exec, api } = setup()
      await api.getMasterLeague('NA1')

      expect(exec).toHaveBeenCalledOnce()
      const [bucket, url] = exec.mock.calls[0]
      expect(bucket).toBe('league')
      expect(url).toContain('na1.api.riotgames.com')
      expect(url).toContain('/tft/league/v1/master')
    })
  })

  describe('getByTierDivision', () => {
    it('calls exec with correct tier and division in URL', async () => {
      const { exec, api } = setup()
      await api.getByTierDivision('JP1', 'DIAMOND', 'I')

      expect(exec).toHaveBeenCalledOnce()
      const [bucket, url] = exec.mock.calls[0]
      expect(bucket).toBe('league')
      expect(url).toContain('/tft/league/v1/entries/DIAMOND/I')
    })

    it('appends page query parameter when page > 1', async () => {
      const { exec, api } = setup()
      await api.getByTierDivision('JP1', 'DIAMOND', 'I', 2)

      const [, url] = exec.mock.calls[0]
      expect(url).toContain('?page=2')
    })

    it('omits page query parameter when page is 1', async () => {
      const { exec, api } = setup()
      await api.getByTierDivision('JP1', 'DIAMOND', 'I', 1)

      const [, url] = exec.mock.calls[0]
      expect(url).not.toContain('?page=')
    })
  })

  describe('getBySummoner', () => {
    it('calls exec with bucket=league and correct URL containing summoner ID', async () => {
      const { exec, api } = setup()
      const summonerId = 'encrypted-summoner-id-123'
      await api.getBySummoner('JP1', summonerId)

      expect(exec).toHaveBeenCalledOnce()
      const [bucket, url] = exec.mock.calls[0]
      expect(bucket).toBe('league')
      expect(url).toContain('jp1.api.riotgames.com')
      expect(url).toContain(`/tft/league/v1/entries/by-summoner/${summonerId}`)
    })
  })
})
