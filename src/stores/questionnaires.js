import { computed, reactive } from 'vue'
import tracerService from '@/services/tracerService'

const STORAGE_KEY = 'tracer_admin_questionnaires'
const AUDIENCES = ['alumni', 'pengguna', 'umum']
const normalizeAudience = (audience) => {
  const value = String(audience || '').trim().toLowerCase()
  if (AUDIENCES.includes(value)) return value
  if (value.startsWith('pengguna')) return 'pengguna'
  if (value.startsWith('umum')) return 'umum'
  return 'alumni'
}
const canUseApi = !!import.meta.env.VITE_API_BASE_URL

const normalizeFromApi = (payload) => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  return []
}

const defaultQuestionSections = [
  {
    id: 'identitas',
    title: 'A. Identitas Dasar',
    fields: ['Nama', 'NIK', 'Alamat', 'No HP', 'NIM', 'Fakultas', 'Program Studi', 'Tahun Lulus'],
  },
  {
    id: 'status',
    title: 'B. Status dan Informasi Pekerjaan',
    fields: ['Jelaskan status Anda saat ini?'],
    statuses: [
      'Bekerja (full time / part time)',
      'Wiraswasta',
      'Melanjutkan pendidikan',
      'Tidak bekerja tetapi sedang mencari kerja',
      'Belum memungkinkan untuk bekerja',
    ],
  },
]

const defaultEmployerQuestionSections = [
  {
    id: 'profil',
    title: 'A. Profil Organisasi',
    fields: [
      'Nama perusahaan/instansi',
      'Bidang industri',
      'Nama PIC',
      'Jabatan PIC',
      'Email / No. kontak',
      'Kota/kabupaten',
    ],
  },
  {
    id: 'penilaian',
    title: 'B. Penilaian Alumni',
    fields: ['Kinerja alumni kami', 'Kompetensi paling menonjol', 'Area pengembangan yang diharapkan'],
  },
  {
    id: 'kebutuhan',
    title: 'C. Rencana Rekrutmen',
    fields: ['Jumlah alumni yang direkrut', 'Peran yang dibutuhkan', 'Waktu kebutuhan tenaga kerja'],
  },
]

const defaultGeneralQuestionSections = [
  {
    id: 'umum-profil',
    title: 'A. Informasi umum',
    fields: ['Nama', 'Kontak', 'Kota/Kabupaten', 'Instansi/Organisasi', 'Catatan'],
  },
]

const defaultQuestionsByAudience = {
  alumni: defaultQuestionSections,
  pengguna: defaultEmployerQuestionSections,
  umum: defaultGeneralQuestionSections,
}

const cloneQuestions = (sections, audience = 'alumni') =>
  JSON.parse(
    JSON.stringify(
      sections && sections.length ? sections : defaultQuestionsByAudience[normalizeAudience(audience)],
    ),
  )

const cloneExtraQuestions = (extra) => JSON.parse(JSON.stringify(extra || []))

const state = reactive({
  items: [],
  loading: false,
  error: '',
  questions: {},
  questionsLoading: false,
  questionsError: '',
})

const saveQuestionnaires = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
}

const resetQuestionnaires = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    // ignore
  }
  state.items = []
  loadQuestionnaires()
}

const ensureQuestions = () => {
  state.items.forEach((item) => {
    const fallbackAudience =
      item.audience ||
      item.targetAudience ||
      item.targetRespondent ||
      item.target_responden ||
      item.target ||
      ''
    // eslint-disable-next-line no-param-reassign
    item.audience = normalizeAudience(fallbackAudience)
    if (!Array.isArray(item.questions) || !item.questions.length) {
      // eslint-disable-next-line no-param-reassign
      item.questions = cloneQuestions(null, item.audience)
    }
    if (!Array.isArray(item.extraQuestions)) {
      // eslint-disable-next-line no-param-reassign
      item.extraQuestions = []
    }
  })
}

const enforceSingleActivePerAudience = () => {
  AUDIENCES.forEach((aud) => {
    let foundActiveId = null
    state.items.forEach((item) => {
      const normalized = normalizeAudience(item.audience)
      if (normalized !== aud) return
      if (item.active && !foundActiveId) {
        foundActiveId = item.id
      }
    })
    state.items = state.items.map((item) => {
      const normalized = normalizeAudience(item.audience)
      if (normalized !== aud) return item
      if (foundActiveId) {
        return { ...item, active: item.id === foundActiveId }
      }
      return item
    })
  })
}

const ensureDefaultByAudience = () => {
  const nowIso = new Date().toISOString()
  const defaultMeta = {
    alumni: {
      title: 'Isi kuisioner alumni',
      chipText: 'Tracer Study 2025 - Kuisioner sudah dibuka',
      description:
        'Partisipasi Anda mendukung peningkatan kurikulum, kerjasama industri, dan layanan karier mahasiswa.',
    },
    pengguna: {
      title: 'Kuisioner pengguna alumni',
      chipText: 'Tracer Study - Kuisioner pengguna dibuka',
      description:
        'Berikan penilaian terhadap performa alumni yang bekerja di organisasi Anda.',
    },
    umum: {
      title: 'Kuisioner umum',
      chipText: 'Kuisioner umum dibuka',
      description: 'Gunakan untuk riset atau survei umum yang tidak spesifik alumni maupun pengguna.',
    },
  }
  AUDIENCES.forEach((aud) => {
    const hasAudience = state.items.some((item) => normalizeAudience(item.audience) === aud)
    if (!hasAudience) {
      const fallback = defaultMeta[aud] || defaultMeta.alumni
      state.items.push({
        id: Date.now() + state.items.length + aud.length,
        title: fallback.title,
        chipText: fallback.chipText,
        description: fallback.description,
        estimatedTime: '+/-5 menit',
        audience: aud,
        active: !state.items.some((item) => item.active && normalizeAudience(item.audience) === aud),
        createdAt: nowIso,
        updatedAt: nowIso,
        questions: cloneQuestions(null, aud),
        extraQuestions: [],
      })
    }
  })
}

const loadQuestionnaires = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      state.items = JSON.parse(raw)
    }
  } catch (e) {
    state.items = []
  }

  if (!state.items.length) {
    const now = new Date().toISOString()
    state.items = [
      {
        id: Date.now(),
        title: 'Isi kuisioner alumni',
        chipText: 'Tracer Study 2025 - Kuisioner sudah dibuka',
        description:
          'Partisipasi Anda mendukung peningkatan kurikulum, kerjasama industri, dan layanan karier mahasiswa.',
        estimatedTime: '+/-5 menit',
        audience: 'alumni',
        active: true,
        createdAt: now,
        updatedAt: now,
        questions: cloneQuestions(),
        extraQuestions: [],
      },
    ]
    ensureDefaultByAudience()
    saveQuestionnaires()
  } else {
    ensureQuestions()
    ensureDefaultByAudience()
    saveQuestionnaires()
  }
}

loadQuestionnaires()

export const useQuestionnaires = () => {
  const questionnaires = computed(() =>
    [...state.items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  )

  const findActiveByAudience = (audience = 'alumni') => {
    const normalized = normalizeAudience(audience)
    const activeItem = state.items.find(
      (item) => item.active && normalizeAudience(item.audience) === normalized,
    )
    if (activeItem) return activeItem
    return state.items.find((item) => normalizeAudience(item.audience) === normalized) || null
  }

  const activeQuestionnaire = computed(() =>
    findActiveByAudience('alumni'),
  )

  const activeQuestionnairesByAudience = computed(() => ({
    alumni: findActiveByAudience('alumni'),
    pengguna: findActiveByAudience('pengguna'),
    umum: findActiveByAudience('umum'),
  }))

  const addQuestionnaire = (payload) => {
    const timestamp = Date.now()
    const audience = normalizeAudience(payload.audience)
    const item = {
      id: timestamp,
      title: payload.title?.trim() || 'Kuisioner alumni',
      chipText:
        payload.chipText?.trim() ||
        'Tracer Study - Kuisioner dibuka',
      description:
        payload.description?.trim() ||
        'Partisipasi Anda mendukung peningkatan kurikulum dan layanan karier mahasiswa.',
      estimatedTime: payload.estimatedTime?.trim() || '+/-5 menit',
      audience,
      active: !!payload.active,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: cloneQuestions(payload.questions, audience),
      extraQuestions: cloneExtraQuestions(payload.extraQuestions),
    }

    if (item.active) {
      state.items.forEach((q) => {
        // eslint-disable-next-line no-param-reassign
        if (normalizeAudience(q.audience) === audience) {
          q.active = false
        }
      })
    }

    state.items.unshift(item)
    enforceSingleActivePerAudience()
    saveQuestionnaires()
  }

  const updateQuestionnaire = (id, updates) => {
    const index = state.items.findIndex((item) => item.id === id)
    if (index === -1) return false

    const current = state.items[index]
    const audience = normalizeAudience(updates.audience || current.audience)

    const updated = {
      ...current,
      audience,
      ...updates,
      title: updates.title?.trim() || current.title,
      chipText: updates.chipText?.trim() || current.chipText,
      description: updates.description?.trim() || current.description,
      estimatedTime: updates.estimatedTime?.trim() || current.estimatedTime,
      updatedAt: new Date().toISOString(),
      questions: cloneQuestions(updates.questions || current.questions, audience),
      extraQuestions: cloneExtraQuestions(updates.extraQuestions || current.extraQuestions),
    }

    if (typeof updates.active === 'boolean') {
      if (updates.active) {
        state.items.forEach((q) => {
          // eslint-disable-next-line no-param-reassign
          if (normalizeAudience(q.audience) === audience) {
            q.active = false
          }
        })
        updated.active = true
      } else {
        updated.active = false
      }
    }

    state.items.splice(index, 1, updated)
    enforceSingleActivePerAudience()
    saveQuestionnaires()
    return true
  }

  const deleteQuestionnaire = (id) => {
    const index = state.items.findIndex((item) => item.id === id)
    if (index === -1) return false

    const audience = normalizeAudience(state.items[index].audience)
    const questionCacheKey = state.items[index].id
    const wasActive = state.items[index].active
    state.items.splice(index, 1)

    if (wasActive) {
      const firstSameAudience = state.items.find((item) => normalizeAudience(item.audience) === audience)
      if (firstSameAudience) {
        firstSameAudience.active = true
      }
    }

    if (questionCacheKey && state.questions[questionCacheKey]) {
      delete state.questions[questionCacheKey]
    }

    saveQuestionnaires()
    return true
  }

  const setActiveQuestionnaire = (id) => {
    const index = state.items.findIndex((item) => item.id === id)
    if (index === -1) return false

    const audience = normalizeAudience(state.items[index].audience)

    state.items.forEach((q, idx) => {
      // eslint-disable-next-line no-param-reassign
      if (normalizeAudience(q.audience) === audience) {
        q.active = idx === index
      }
    })

    enforceSingleActivePerAudience()
    saveQuestionnaires()
    return true
  }

  // --- API helpers (opsional; fallback ke localStorage jika API gagal) ---
  const fetchActiveFallbackList = async (requestConfig = {}) => {
    if (!canUseApi) return []
    const audiences = ['alumni', 'pengguna', 'umum']
    const list = []
    await Promise.all(
      audiences.map(async (audience) => {
        try {
          const resp = await tracerService.getActiveQuestionnaire(audience, requestConfig)
          const item = resp?.data || resp
          if (item?.id) list.push(item)
        } catch (err) {
          // ignore per-audience errors, fallback continues with available items
        }
      }),
    )
    const uniqueMap = new Map()
    list.forEach((item) => {
      uniqueMap.set(String(item.id), item)
    })
    return Array.from(uniqueMap.values())
  }

  const applyListToState = (list = []) => {
    state.items = Array.isArray(list) ? list : []
    ensureQuestions()
    ensureDefaultByAudience()
    enforceSingleActivePerAudience()
    saveQuestionnaires()
  }

  const fetchQuestionnaires = async (params = {}, options = {}) => {
    const publicMode = Boolean(options?.publicMode)
    const requestConfig = {
      ...(options?.requestConfig || {}),
      ...(publicMode ? { skipAuthRedirect: true } : {}),
    }
    state.loading = true
    state.error = ''
    try {
      if (canUseApi) {
        let list = []
        if (publicMode) {
          list = await fetchActiveFallbackList(requestConfig)
        } else {
          const resp = await tracerService.getQuestionnaires(params, requestConfig)
          list = normalizeFromApi(resp)
          if (!list.length) {
            list = await fetchActiveFallbackList(requestConfig)
          }
        }
        if (list.length) {
          applyListToState(list)
        } else if (!state.items.length) {
          loadQuestionnaires()
        }
      } else {
        loadQuestionnaires()
      }
    } catch (err) {
      if (!publicMode) {
        state.error = err?.message || 'Gagal memuat kuisioner'
      } else {
        state.error = ''
      }
      if ((!state.items.length || publicMode) && canUseApi) {
        const fallbackList = await fetchActiveFallbackList(requestConfig)
        if (fallbackList.length) {
          applyListToState(fallbackList)
          return
        }
      }
      if (!state.items.length) {
        loadQuestionnaires()
      }
      if (!state.items.length) {
        ensureDefaultByAudience()
        saveQuestionnaires()
      }
    } finally {
      state.loading = false
    }
  }

  const createQuestionnaireApi = async (payload) => {
    if (!canUseApi) {
      addQuestionnaire(payload)
      return
    }
    const resp = await tracerService.createQuestionnaire(payload)
    const item = resp?.data || resp
    if (item) {
      state.items.unshift(item)
      ensureQuestions()
      enforceSingleActivePerAudience()
      saveQuestionnaires()
    }
  }

  const updateQuestionnaireApi = async (id, payload) => {
    if (!canUseApi) {
      updateQuestionnaire(id, payload)
      return
    }
    const current = state.items.find((q) => q.id === id)
    const normalizedAudience = normalizeAudience(payload.audience || current?.audience)
    const body = { ...payload, audience: normalizedAudience }
    const resp = await tracerService.updateQuestionnaire(id, body)
    const updated = resp?.data || resp
    if (updated) {
      const idx = state.items.findIndex((item) => item.id === id)
      if (idx !== -1) {
        state.items.splice(idx, 1, updated)
      }
      ensureQuestions()
      enforceSingleActivePerAudience()
      saveQuestionnaires()
    }
  }

  const deleteQuestionnaireApi = async (id) => {
    if (!canUseApi) {
      deleteQuestionnaire(id)
      return
    }
    await tracerService.deleteQuestionnaire(id)
    const idx = state.items.findIndex((item) => item.id === id)
    if (idx !== -1) {
      state.items.splice(idx, 1)
      ensureDefaultByAudience()
      saveQuestionnaires()
    }
  }

  const fetchActiveQuestionnaire = async (audience = 'alumni', options = {}) => {
    const requestConfig = options?.requestConfig || {}
    const silent = Boolean(options?.silent)
    state.loading = true
    state.error = ''
    try {
      if (canUseApi) {
        const resp = await tracerService.getActiveQuestionnaire(audience, requestConfig)
        const item = resp?.data || resp
        if (item?.id) {
          const idx = state.items.findIndex((q) => q.id === item.id)
          if (idx !== -1) {
            state.items.splice(idx, 1, item)
          } else {
            state.items.unshift(item)
          }
          ensureQuestions()
          enforceSingleActivePerAudience()
          saveQuestionnaires()
          return item
        }
      }
      return findActiveByAudience(audience)
    } catch (err) {
      const status = err?.response?.status
      if (status === 404) {
        // Backend belum menyediakan kuisioner aktif; gunakan fallback lokal tanpa menampilkan error 404.
        state.error = ''
        return findActiveByAudience(audience)
      }
      state.error = silent ? '' : err?.message || 'Gagal memuat kuisioner aktif'
      return findActiveByAudience(audience)
    } finally {
      state.loading = false
    }
  }

  const fetchQuestions = async (questionnaireId) => {
    if (!questionnaireId) return []
    state.questionsLoading = true
    state.questionsError = ''
    try {
      if (canUseApi) {
        const resp = await tracerService.getQuestions(questionnaireId)
        const list = normalizeFromApi(resp)
        state.questions[questionnaireId] = list
        return list
      }
      return state.questions[questionnaireId] || []
    } catch (err) {
      const status = err?.response?.status
      if (status === 404) {
        // Backend belum menyediakan pertanyaan; hindari badge error.
        state.questionsError = ''
        return state.questions[questionnaireId] || []
      }
      state.questionsError = err?.message || 'Gagal memuat pertanyaan'
      return state.questions[questionnaireId] || []
    } finally {
      state.questionsLoading = false
    }
  }

  const questionsById = (questionnaireId) => state.questions[questionnaireId] || []

  const createQuestionApi = async (questionnaireId, payload) => {
    if (!questionnaireId) throw new Error('questionnaireId wajib diisi')
    if (!canUseApi) {
      const local = state.questions[questionnaireId] || []
      const item = { ...payload, id: payload.id || Date.now().toString(), questionnaireId }
      state.questions[questionnaireId] = [item, ...local]
      return item
    }
    const resp = await tracerService.createQuestion(questionnaireId, payload)
    const item = resp?.data || resp
    if (!state.questions[questionnaireId]) state.questions[questionnaireId] = []
    state.questions[questionnaireId].unshift(item)
    return item
  }

  const updateQuestionApi = async (questionnaireId, questionId, payload) => {
    if (!questionnaireId || !questionId) throw new Error('questionnaireId dan questionId wajib diisi')
    if (!canUseApi) {
      const list = state.questions[questionnaireId] || []
      const idx = list.findIndex((q) => q.id === questionId)
      if (idx !== -1) {
        list.splice(idx, 1, { ...list[idx], ...payload })
        state.questions[questionnaireId] = [...list]
      }
      return
    }
    const resp = await tracerService.updateQuestion(questionnaireId, questionId, payload)
    const item = resp?.data || resp
    const list = state.questions[questionnaireId] || []
    const idx = list.findIndex((q) => q.id === questionId)
    if (idx !== -1) {
      list.splice(idx, 1, item)
      state.questions[questionnaireId] = [...list]
    }
  }

  const deleteQuestionApi = async (questionnaireId, questionId) => {
    if (!questionnaireId || !questionId) throw new Error('questionnaireId dan questionId wajib diisi')
    if (canUseApi) {
      await tracerService.deleteQuestion(questionnaireId, questionId)
    }
    const list = state.questions[questionnaireId] || []
    const idx = list.findIndex((q) => q.id === questionId)
    if (idx !== -1) {
      list.splice(idx, 1)
      state.questions[questionnaireId] = [...list]
    }
  }

  return {
    questionnaires,
    activeQuestionnaire,
    activeQuestionnairesByAudience,
    getActiveQuestionnaireByAudience: findActiveByAudience,
    resetQuestionnaires,
    addQuestionnaire,
    updateQuestionnaire,
    deleteQuestionnaire,
    setActiveQuestionnaire,
    fetchQuestionnaires,
    createQuestionnaireApi,
    updateQuestionnaireApi,
    deleteQuestionnaireApi,
    fetchActiveQuestionnaire,
    fetchQuestions,
    questionsById,
    createQuestionApi,
    updateQuestionApi,
    deleteQuestionApi,
    loading: computed(() => state.loading),
    error: computed(() => state.error),
    questionsLoading: computed(() => state.questionsLoading),
    questionsError: computed(() => state.questionsError),
  }
}
