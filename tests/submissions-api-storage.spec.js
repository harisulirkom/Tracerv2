import { beforeEach, describe, expect, it, vi } from 'vitest'

const getResponses = vi.fn()

vi.mock('../src/services/tracerService', () => ({
  default: {
    getResponses,
  },
}))

describe('API submissions storage', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.resetModules()
  })

  it('removes the legacy response cache when API mode starts', async () => {
    localStorage.setItem('tracer_submissions', JSON.stringify([{ id: 'legacy' }]))

    await import('../src/stores/submissions')

    expect(localStorage.getItem('tracer_submissions')).toBeNull()
  })

  it('does not persist large API response payloads', async () => {
    const setItem = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
    })
    getResponses.mockResolvedValue({ data: Array.from({ length: 2000 }, (_, id) => ({ id })) })
    const { useSubmissions } = await import('../src/stores/submissions')
    const store = useSubmissions()

    await store.fetchSubmissions({ questionnaireId: 1 })

    expect(store.submissions.items).toHaveLength(2000)
    expect(setItem).not.toHaveBeenCalled()
    expect(store.error.value).toBe('')
  })
})
