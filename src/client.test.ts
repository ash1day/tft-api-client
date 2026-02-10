import { describe, it, expect, vi, afterEach } from 'vitest'
import { TftClient } from './client.js'
import { ApiError, RateLimitError } from './errors.js'

function mockResponse(
  status: number,
  body: unknown,
  headers?: Record<string, string>,
) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers(headers),
    json: () => Promise.resolve(body),
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('TftClient constructor', () => {
  it('throws when apiKey is empty', () => {
    expect(() => new TftClient({ apiKey: '' })).toThrow('apiKey is required')
  })

  it('throws when bufferRate is 0', () => {
    expect(() => new TftClient({ apiKey: 'test-key', bufferRate: 0 })).toThrow(
      'bufferRate must be between 0 (exclusive) and 1 (inclusive)',
    )
  })

  it('throws when bufferRate is greater than 1', () => {
    expect(
      () => new TftClient({ apiKey: 'test-key', bufferRate: 1.5 }),
    ).toThrow(
      'bufferRate must be between 0 (exclusive) and 1 (inclusive)',
    )
  })

  it('accepts valid bufferRate', () => {
    const client = new TftClient({ apiKey: 'test-key', bufferRate: 0.5 })
    expect(client).toBeInstanceOf(TftClient)
    client.destroy()
  })
})

describe('TftClient fetchJson', () => {
  it('makes a successful request with correct URL and headers', async () => {
    const summonerData = {
      id: 'abc123',
      accountId: 'def456',
      puuid: 'test-puuid',
      profileIconId: 1,
      revisionDate: 1234567890,
      summonerLevel: 30,
    }

    const mockFetch = vi.fn().mockResolvedValue(mockResponse(200, summonerData))
    vi.stubGlobal('fetch', mockFetch)

    const client = new TftClient({
      apiKey: 'test-key',
      retry: { maxAttempts: 1 },
    })

    const result = await client.summoner.getByPuuid('JP1', 'test-puuid')

    expect(result).toEqual(summonerData)
    expect(mockFetch).toHaveBeenCalledOnce()

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe(
      'https://jp1.api.riotgames.com/tft/summoner/v1/summoners/by-puuid/test-puuid',
    )
    expect(options.headers).toEqual({
      'X-Riot-Token': 'test-key',
      Accept: 'application/json',
    })

    client.destroy()
  })

  it('throws RateLimitError on 429 with Retry-After header', async () => {
    const rateLimitBody = { message: 'rate limited' }
    const mockFetch = vi.fn().mockResolvedValue(
      mockResponse(429, rateLimitBody, { 'Retry-After': '5' }),
    )
    vi.stubGlobal('fetch', mockFetch)

    const client = new TftClient({
      apiKey: 'test-key',
      retry: { maxAttempts: 1 },
    })

    try {
      await client.summoner.getByPuuid('JP1', 'test-puuid')
      expect.unreachable('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError)
      const rle = error as RateLimitError
      expect(rle.retryAfterMs).toBe(5000)
      expect(rle.body).toEqual(rateLimitBody)
    }

    client.destroy()
  })

  it('sets retryAfterMs to undefined when Retry-After is not a number', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      mockResponse(429, { message: 'rate limited' }, { 'Retry-After': 'invalid' }),
    )
    vi.stubGlobal('fetch', mockFetch)

    const client = new TftClient({
      apiKey: 'test-key',
      retry: { maxAttempts: 1 },
    })

    try {
      await client.summoner.getByPuuid('JP1', 'test-puuid')
      expect.unreachable('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError)
      const rle = error as RateLimitError
      expect(rle.retryAfterMs).toBeUndefined()
    }

    client.destroy()
  })

  it('throws ApiError on non-429 error', async () => {
    const errorBody = { status: { message: 'Data not found', status_code: 404 } }
    const mockFetch = vi.fn().mockResolvedValue(
      mockResponse(404, errorBody),
    )
    vi.stubGlobal('fetch', mockFetch)

    const client = new TftClient({
      apiKey: 'test-key',
      retry: { maxAttempts: 1 },
    })

    try {
      await client.summoner.getByPuuid('JP1', 'test-puuid')
      expect.unreachable('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      const ae = error as ApiError
      expect(ae.status).toBe(404)
      expect(ae.body).toEqual(errorBody)
    }

    client.destroy()
  })

  it('sends an AbortSignal with fetch', async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockResponse(200, {}))
    vi.stubGlobal('fetch', mockFetch)

    const client = new TftClient({
      apiKey: 'test-key',
      retry: { maxAttempts: 1 },
    })

    await client.summoner.getByPuuid('JP1', 'test-puuid')

    const [, options] = mockFetch.mock.calls[0]
    expect(options.signal).toBeInstanceOf(AbortSignal)

    client.destroy()
  })
})

describe('TftClient appRateLimit', () => {
  it('creates client with appRateLimit and can make requests', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      mockResponse(200, { id: 'test' }),
    )
    vi.stubGlobal('fetch', mockFetch)

    const client = new TftClient({
      apiKey: 'test-key',
      appRateLimit: { maxRequests: 100, windowMs: 1000 },
      retry: { maxAttempts: 1 },
    })

    const result = await client.summoner.getByPuuid('JP1', 'test-puuid')
    expect(result).toEqual({ id: 'test' })

    client.destroy()
  })
})

describe('TftClient destroy', () => {
  it('rejects subsequent requests after destroy', async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockResponse(200, {}))
    vi.stubGlobal('fetch', mockFetch)

    const client = new TftClient({
      apiKey: 'test-key',
      retry: { maxAttempts: 1 },
    })

    client.destroy()

    await expect(
      client.summoner.getByPuuid('JP1', 'test-puuid'),
    ).rejects.toThrow('RateLimiter destroyed')
  })
})
