import { beforeEach, describe, expect, it, vi } from 'vitest'
import tracerService from '../src/services/tracerService'
import { useQuestionnaires } from '../src/stores/questionnaires'

vi.mock('../src/services/tracerService', () => ({
  default: {
    getQuestionnaires: vi.fn(),
    getActiveQuestionnaire: vi.fn(),
  },
}))

describe('questionnaire API source of truth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem(
      'tracer_admin_questionnaires',
      JSON.stringify([{ id: 999999, title: 'Kuisioner lokal semu', active: true, audience: 'alumni' }]),
    )
    useQuestionnaires().resetQuestionnaires()
  })

  it('keeps the admin list empty when the API successfully returns no records', async () => {
    tracerService.getQuestionnaires.mockResolvedValue({ data: [] })
    const { questionnaires, fetchQuestionnaires } = useQuestionnaires()

    await fetchQuestionnaires()

    expect(questionnaires.value).toEqual([])
    expect(localStorage.getItem('tracer_admin_questionnaires')).toBe('[]')
  })

  it('returns an empty state instead of a local questionnaire when active API returns 404', async () => {
    tracerService.getActiveQuestionnaire.mockRejectedValue({ response: { status: 404 } })
    const { fetchActiveQuestionnaire, error } = useQuestionnaires()

    const active = await fetchActiveQuestionnaire('alumni')

    expect(active).toBeNull()
    expect(error.value).toBe('')
  })
})
