import { beforeEach, describe, expect, it, vi } from 'vitest'

const { post, setAuthToken } = vi.hoisted(() => ({
  post: vi.fn(),
  setAuthToken: vi.fn(),
}))

vi.mock('../src/services/api', () => ({
  get: vi.fn(),
  post,
  put: vi.fn(),
  del: vi.fn(),
  setAuthToken,
  clearAuthToken: vi.fn(),
}))

import userService from '../src/services/userService'

describe('userService login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses the Cloudflare-compatible session endpoint and stores the token', async () => {
    post.mockResolvedValue({ token: 'production-token' })

    await expect(
      userService.login({ email: 'admin@example.com', password: 'secret' }),
    ).resolves.toEqual({ token: 'production-token' })

    expect(post).toHaveBeenCalledWith(
      '/session/start',
      { email: 'admin@example.com', password: 'secret' },
      { timeout: 10000, skipAuthRedirect: true },
    )
    expect(setAuthToken).toHaveBeenCalledWith('production-token')
  })
})
