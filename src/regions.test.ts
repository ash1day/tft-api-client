import { describe, it, expect } from 'vitest'
import { getRegionGroup, getRegionalHost, getRegionGroupHost } from './regions.js'

describe('regions', () => {
  describe('getRegionGroup', () => {
    it('maps JP1 to asia', () => {
      expect(getRegionGroup('JP1')).toBe('asia')
    })

    it('maps NA1 to americas', () => {
      expect(getRegionGroup('NA1')).toBe('americas')
    })

    it('maps EUW1 to europe', () => {
      expect(getRegionGroup('EUW1')).toBe('europe')
    })

    it('maps OC1 to sea', () => {
      expect(getRegionGroup('OC1')).toBe('sea')
    })

    it('maps KR to asia', () => {
      expect(getRegionGroup('KR')).toBe('asia')
    })
  })

  describe('getRegionalHost', () => {
    it('returns correct host for JP1', () => {
      expect(getRegionalHost('JP1')).toBe('https://jp1.api.riotgames.com')
    })

    it('returns correct host for NA1', () => {
      expect(getRegionalHost('NA1')).toBe('https://na1.api.riotgames.com')
    })

    it('returns correct host for KR', () => {
      expect(getRegionalHost('KR')).toBe('https://kr.api.riotgames.com')
    })
  })

  describe('getRegionGroupHost', () => {
    it('returns correct host for americas', () => {
      expect(getRegionGroupHost('americas')).toBe('https://americas.api.riotgames.com')
    })

    it('returns correct host for asia', () => {
      expect(getRegionGroupHost('asia')).toBe('https://asia.api.riotgames.com')
    })

    it('returns correct host for europe', () => {
      expect(getRegionGroupHost('europe')).toBe('https://europe.api.riotgames.com')
    })

    it('returns correct host for sea', () => {
      expect(getRegionGroupHost('sea')).toBe('https://sea.api.riotgames.com')
    })
  })
})
