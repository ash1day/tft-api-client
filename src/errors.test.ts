import { describe, it, expect } from 'vitest'
import { ApiError, RateLimitError } from './errors.js'

describe('ApiError', () => {
  it('has correct name, message, status, and body', () => {
    const body = { message: 'Not Found' }
    const error = new ApiError('API request failed: 404 Not Found', 404, body)

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('ApiError')
    expect(error.message).toBe('API request failed: 404 Not Found')
    expect(error.status).toBe(404)
    expect(error.body).toEqual({ message: 'Not Found' })
  })

  it('works with undefined body', () => {
    const error = new ApiError('API request failed: 500 Internal Server Error', 500)

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('ApiError')
    expect(error.message).toBe('API request failed: 500 Internal Server Error')
    expect(error.status).toBe(500)
    expect(error.body).toBeUndefined()
  })
})

describe('RateLimitError', () => {
  it('has correct name, message, retryAfterMs, and body', () => {
    const body = { message: 'Rate limit exceeded' }
    const error = new RateLimitError('Rate limited on /api/test', 5000, body)

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('RateLimitError')
    expect(error.message).toBe('Rate limited on /api/test')
    expect(error.retryAfterMs).toBe(5000)
    expect(error.body).toEqual({ message: 'Rate limit exceeded' })
  })

  it('works with undefined retryAfterMs and body', () => {
    const error = new RateLimitError('Rate limited')

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('RateLimitError')
    expect(error.message).toBe('Rate limited')
    expect(error.retryAfterMs).toBeUndefined()
    expect(error.body).toBeUndefined()
  })
})
