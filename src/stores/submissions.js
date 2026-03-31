import { computed, reactive } from 'vue'
import tracerService from '@/services/tracerService'

const STORAGE_KEY = 'tracer_submissions'
const canUseApi = !!import.meta.env.VITE_API_BASE_URL

const state = reactive({
  items: [],
  pagedItems: [],
  pagedMeta: {},
  pagedLinks: {},
  pagedLoading: false,
  pagedError: '',
  loading: false,
  error: '',
})

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      state.items = JSON.parse(raw)
    }
  } catch (e) {
    state.items = []
  }
}

const save = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
}

load()

export const useSubmissions = () => {
  const extractNim = (payload = {}) =>
    String(payload.nim || payload.raw?.nim || payload.raw?.biodata?.nim || '').trim()

  const nextAttemptNumber = (nim, type = 'alumni') => {
    if (!nim) return 1
    const existing = state.items.filter(
      (item) =>
        (item.type || '').toLowerCase() === (type || '').toLowerCase() &&
        String(item.nim || item.raw?.nim || '').trim() === nim,
    )
    if (!existing.length) return 1
    const maxAttempt = Math.max(
      ...existing.map((item) => Number(item.attemptNumber || item.attempt_number || 0) || 0),
    )
    return maxAttempt + 1
  }

  const addSubmission = async (payload, options = {}) => {
    const nim = extractNim(payload)
    const normalized = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      createdAt: new Date().toISOString(),
      attemptNumber: nextAttemptNumber(nim, payload.type),
      attemptLabel: '',
      nim,
      raw: payload.raw || payload,
      ...payload,
      type: (payload.type || '').toLowerCase(),
    }
    normalized.attemptLabel = normalized.attemptNumber
      ? `Pengisian ke-${normalized.attemptNumber}`
      : ''

    if (canUseApi && !options.skipApi) {
      try {
        const resp = await tracerService.submitAlumniAnswer(payload)
        const attemptFromApi =
          resp?.data?.attemptNumber ||
          resp?.data?.attempt_number ||
          resp?.attemptNumber ||
          resp?.attempt_number
        if (resp?.data) normalized.id = resp.data.id || normalized.id
        if (attemptFromApi) {
          normalized.attemptNumber = attemptFromApi
          normalized.attemptLabel = `Pengisian ke-${attemptFromApi}`
        }
      } catch (err) {
        state.error = err?.message || 'Gagal menyimpan ke server, disimpan lokal.'
      }
    }

    state.items.unshift(normalized)
    save()
    return normalized
  }

  const addSubmissionBatch = async (payloads = []) => {
    if (!Array.isArray(payloads) || !payloads.length) return 0
    if (canUseApi) {
      try {
        await tracerService.submitBulkSubmissions(payloads)
      } catch (err) {
        state.error = err?.message || 'Gagal impor bulk, menyimpan lokal.'
      }
    }
    payloads.forEach((p) => addSubmission(p, { skipApi: true }))
    return payloads.length
  }

  const attemptsByNim = (nim, type = 'alumni') => {
    const key = String(nim || '').trim()
    return state.items
      .filter(
        (item) =>
          (item.type || '').toLowerCase() === (type || '').toLowerCase() &&
          String(item.nim || item.raw?.nim || '').trim() === key,
      )
      .sort((a, b) => {
        const aNum = Number(a.attemptNumber || a.attempt_number || 0) || 0
        const bNum = Number(b.attemptNumber || b.attempt_number || 0) || 0
        if (aNum === bNum) {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        }
        return bNum - aNum
      })
  }

  const latestByType = (type) =>
    state.items.find((item) => (item.type || '').toLowerCase() === (type || '').toLowerCase()) || null

  const fetchSubmissions = async (params = {}, options = {}) => {
    const { questionnaireId, ...query } = params
    const requestConfig = options?.requestConfig || {}
    const silent = Boolean(options?.silent)
    state.loading = true
    state.error = ''
    try {
      if (canUseApi && questionnaireId) {
        const resp = await tracerService.getResponses(questionnaireId, query, requestConfig)
        const list = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : []
        if (list.length) {
          state.items = list
          save()
        }
      }
    } catch (err) {
      state.error = silent ? '' : err?.message || 'Gagal memuat submissions'
    } finally {
      state.loading = false
    }
  }

  const fetchSubmissionsPage = async (params = {}) => {
    const { questionnaireId, ...query } = params
    state.pagedLoading = true
    state.pagedError = ''
    try {
      if (canUseApi && questionnaireId) {
        const resp = await tracerService.getResponses(questionnaireId, query)
        const list = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : []
        state.pagedItems = list
        state.pagedMeta = resp?.meta || resp?.data?.meta || {}
        state.pagedLinks = resp?.links || resp?.data?.links || {}
        return list
      }
    } catch (err) {
      state.pagedError = err?.message || 'Gagal memuat submissions'
    } finally {
      state.pagedLoading = false
    }
    return []
  }

  const deleteSubmission = async (id) => {
    if (canUseApi) {
      try {
        await tracerService.deleteSubmission(id)
      } catch (err) {
        state.error = err?.message || 'Gagal menghapus di server'
      }
    }
    const index = state.items.findIndex((item) => item.id === id)
    if (index !== -1) {
      state.items.splice(index, 1)
      save()
    }
  }

  return {
    submissions: state,
    addSubmission,
    addSubmissionBatch,
    latestAlumni: computed(() => latestByType('alumni')),
    latestByType,
    fetchSubmissions,
    fetchSubmissionsPage,
    deleteSubmission,
    attemptsByNim,
    loading: computed(() => state.loading),
    error: computed(() => state.error),
    pagedItems: computed(() => state.pagedItems),
    pagedMeta: computed(() => state.pagedMeta),
    pagedLinks: computed(() => state.pagedLinks),
    pagedLoading: computed(() => state.pagedLoading),
    pagedError: computed(() => state.pagedError),
  }
}
