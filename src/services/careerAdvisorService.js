import { get, patch, post } from './api'

const BASE_PATH = '/v1/career-advisor'
const MOCK_STORAGE_KEY = 'career_advisor_mock_sessions_v1'
const FORCE_MOCK = String(import.meta.env.VITE_CAREER_ADVISOR_FORCE_MOCK || '').toLowerCase() === 'true'

const REQUIRED_PROFILE_FIELDS = [
  'graduation_year',
  'study_program',
  'target_industry',
  'target_role',
  'skill_level',
  'strongest_skill',
  'biggest_gap',
  'work_style',
  'weekly_hours',
  'motivator',
  'career_goal',
  'support_type',
]

const MOCK_OPTIONS = {
  personas: [
    { id: 'fresh', label: 'Fresh Graduate', summary: 'Belum bekerja, butuh peta jalan karir yang jelas.' },
    { id: 'switcher', label: 'Career Switcher', summary: 'Ingin pindah jalur kerja dengan risiko transisi lebih rendah.' },
    { id: 'entrepreneur', label: 'Entrepreneur Track', summary: 'Menjalankan usaha sambil menjaga peluang karir profesional.' },
  ],
  industries: ['Teknologi', 'Pendidikan', 'Perbankan', 'Pemerintahan', 'Kreatif', 'Kesehatan'],
  skill_levels: ['dasar', 'menengah', 'lanjut'],
  work_styles: ['Remote', 'Hybrid', 'Onsite'],
  weekly_hours: ['3-5', '6-8', '>8'],
  motivators: ['Stabilitas karir', 'Dampak sosial', 'Penghasilan', 'Fleksibilitas waktu', 'Pembelajaran cepat'],
  support_types: ['Konseling CDC', 'Roadmap AI mandiri', 'Mentoring alumni', 'Komunitas praktik'],
}

const MOCK_MATCHES_BY_PERSONA = {
  fresh: [
    { role: 'Data Analyst Junior', score: 88, eta: '8-10 minggu' },
    { role: 'Business Intelligence Associate', score: 83, eta: '10-12 minggu' },
    { role: 'Marketing Data Specialist', score: 76, eta: '12 minggu' },
  ],
  switcher: [
    { role: 'Product Operations Analyst', score: 85, eta: '8-10 minggu' },
    { role: 'Business Analyst', score: 80, eta: '10-12 minggu' },
    { role: 'Growth Analyst', score: 74, eta: '12 minggu' },
  ],
  entrepreneur: [
    { role: 'Business Development Associate', score: 83, eta: '8 minggu' },
    { role: 'Partnership Specialist', score: 78, eta: '10 minggu' },
    { role: 'Program Officer', score: 73, eta: '12 minggu' },
  ],
}

const MOCK_PLAN_BY_PERSONA = {
  fresh: [
    { phase: 'Minggu 1-2', focus: 'Fundamental skill: SQL dasar, data cleaning, dan alat kerja.' },
    { phase: 'Minggu 3-4', focus: 'Project mini + dashboard sederhana untuk portofolio.' },
    { phase: 'Minggu 5-8', focus: 'Latihan studi kasus industri target dan review mentor.' },
    { phase: 'Minggu 9-12', focus: 'Mock interview, optimasi CV, dan apply terukur.' },
  ],
  switcher: [
    { phase: 'Minggu 1-2', focus: 'Pemetaan transferable skill dari pengalaman sebelumnya.' },
    { phase: 'Minggu 3-4', focus: 'Penguatan kompetensi inti role target.' },
    { phase: 'Minggu 5-8', focus: 'Project transisi role + feedback dari praktisi.' },
    { phase: 'Minggu 9-12', focus: 'Storytelling karir, interview drill, apply plan.' },
  ],
  entrepreneur: [
    { phase: 'Minggu 1-2', focus: 'Klarifikasi value proposition pribadi dan bisnis.' },
    { phase: 'Minggu 3-4', focus: 'KPI dasar, analisis channel, dan prioritas strategi.' },
    { phase: 'Minggu 5-8', focus: 'Eksperimen lapangan + pencatatan outcome.' },
    { phase: 'Minggu 9-12', focus: 'Pitch refinement, jaringan profesional, opsi role hybrid.' },
  ],
}

const safeParse = (raw, fallback) => {
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

const nowIso = () => new Date().toISOString()

const buildMockResponse = (message, data, source = 'mock') => ({
  status: true,
  message,
  data: {
    ...data,
    source,
  },
})

const readMockStore = () => {
  if (typeof localStorage === 'undefined') return {}
  return safeParse(localStorage.getItem(MOCK_STORAGE_KEY) || '{}', {})
}

const writeMockStore = (store) => {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(store))
}

const createMockId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const normalizeConfidenceBand = (percent) => {
  if (percent < 60) return 'rendah'
  if (percent < 85) return 'sedang'
  return 'tinggi'
}

const countRequiredFieldCompletion = (profile) =>
  REQUIRED_PROFILE_FIELDS.reduce((total, key) => (String(profile?.[key] || '').trim() ? total + 1 : total), 0)

const clampScore = (score) => Math.max(0, Math.min(95, score))

const withMockFallback = async (apiCall, mockCall) => {
  if (FORCE_MOCK) return mockCall()
  return apiCall()
}

const buildMotivationNarrative = (profile) => {
  const role = profile?.target_role || 'role target'
  const industry = profile?.target_industry || 'industri pilihan'
  const motivator = profile?.motivator || 'motivasi pribadi'
  const strongestSkill = profile?.strongest_skill || 'kekuatan utama'
  const biggestGap = profile?.biggest_gap || 'gap prioritas'
  const weeklyHours = profile?.weekly_hours || 'waktu belajar terencana'

  return `Kamu menargetkan ${role} di sektor ${industry} dengan motivator utama ${motivator}. Kekuatanmu di ${strongestSkill} dan gap utama di ${biggestGap}. Dengan komitmen ${weeklyHours} jam/minggu, roadmap ini dirancang agar progresmu terukur dan realistis.`
}

const getSessionFromStoreOrThrow = (store, sessionId) => {
  const session = store[sessionId]
  if (!session) {
    const error = new Error('Session not found')
    error.response = { status: 404 }
    throw error
  }
  return session
}

const mockGetOptions = async () => buildMockResponse('OK', MOCK_OPTIONS)

const mockCreateSession = async ({ persona_id }) => {
  const store = readMockStore()
  const sessionId = createMockId('ca_sess')
  const createdAt = nowIso()

  store[sessionId] = {
    session_id: sessionId,
    analysis_id: null,
    persona_id,
    profile: {},
    recommendation: null,
    recommendation_source: 'mock',
    generation_status: 'idle',
    feedback: null,
    next_action: null,
    created_at: createdAt,
    updated_at: createdAt,
  }

  writeMockStore(store)

  return buildMockResponse('Session created', {
    session_id: sessionId,
    persona_id,
    form_completion_percent: 0,
    ready_for_generate: false,
    created_at: createdAt,
  })
}

const mockPatchProfile = async (sessionId, payload) => {
  const store = readMockStore()
  const session = getSessionFromStoreOrThrow(store, sessionId)

  session.profile = { ...session.profile, ...payload }
  session.updated_at = nowIso()

  const completed = countRequiredFieldCompletion(session.profile)
  const completionPercent = Math.round((completed / REQUIRED_PROFILE_FIELDS.length) * 100)
  const missingRequiredFields = REQUIRED_PROFILE_FIELDS.filter(
    (field) => !String(session.profile[field] || '').trim(),
  )

  writeMockStore(store)

  return buildMockResponse('Profile updated', {
    session_id: sessionId,
    form_completion_percent: completionPercent,
    confidence_band: normalizeConfidenceBand(completionPercent),
    ready_for_generate: missingRequiredFields.length === 0,
    missing_required_fields: missingRequiredFields,
  })
}

const buildFallbackRecommendation = (session) => {
  const personaId = session.persona_id || 'fresh'
  const baseMatches = MOCK_MATCHES_BY_PERSONA[personaId] || MOCK_MATCHES_BY_PERSONA.fresh
  const basePlan = MOCK_PLAN_BY_PERSONA[personaId] || MOCK_PLAN_BY_PERSONA.fresh
  const profile = session.profile || {}

  const completionPercent = Math.round(
    (countRequiredFieldCompletion(profile) / REQUIRED_PROFILE_FIELDS.length) * 100,
  )

  const levelBonus = profile.skill_level === 'lanjut' ? 3 : profile.skill_level === 'menengah' ? 1 : 0
  const completionBonus = completionPercent >= 95 ? 2 : completionPercent >= 85 ? 1 : 0
  const totalBonus = levelBonus + completionBonus

  const recommendations = baseMatches.map((item, index) => ({
    role: item.role,
    score: clampScore(item.score + totalBonus - index),
    eta: item.eta,
    reason: `Cocok dengan target ${profile.target_role || 'role pilihan'} dan prioritas ${profile.target_industry || 'industri'}.`,
  }))

  const confidenceScore = Math.min(0.96, Math.max(0.58, completionPercent / 100 + 0.05))

  return {
    analysis_id: createMockId('ca_an'),
    generation_status: 'completed',
    confidence_score: Number(confidenceScore.toFixed(2)),
    confidence_band: normalizeConfidenceBand(completionPercent),
    motivation_narrative: buildMotivationNarrative(profile),
    recommendations,
    skill_gap: [profile.biggest_gap || 'Skill prioritas belum diisi', 'Project portfolio', 'Interview readiness'],
    plan_12_weeks: basePlan,
    generated_at: nowIso(),
  }
}

const buildSessionRecommendation = async (session) => {
  const fallback = buildFallbackRecommendation(session)
  // Frontend tidak boleh memegang API key provider AI.
  // Jika endpoint backend tidak tersedia, gunakan fallback lokal hanya untuk preview internal.
  return {
    recommendation: fallback,
    source: 'mock',
  }
}

const mockGenerate = async (sessionId) => {
  const store = readMockStore()
  const session = getSessionFromStoreOrThrow(store, sessionId)

  const missingRequiredFields = REQUIRED_PROFILE_FIELDS.filter(
    (field) => !String(session.profile?.[field] || '').trim(),
  )

  if (missingRequiredFields.length > 0) {
    const error = new Error('Profile incomplete')
    error.response = {
      status: 422,
      data: {
        status: false,
        message: 'Validation failed',
        error_code: 'PROFILE_INCOMPLETE',
        errors: missingRequiredFields.reduce((acc, key) => {
          acc[key] = [`${key} is required`]
          return acc
        }, {}),
      },
    }
    throw error
  }

  const built = await buildSessionRecommendation(session)
  session.generation_status = 'completed'
  session.recommendation = built.recommendation
  session.recommendation_source = built.source
  session.analysis_id = session.recommendation.analysis_id
  session.updated_at = nowIso()
  writeMockStore(store)

  return buildMockResponse('Generation completed', {
    session_id: sessionId,
    analysis_id: session.analysis_id,
    generation_status: 'completed',
  }, session.recommendation_source || 'mock')
}

const mockGetResult = async (sessionId) => {
  const store = readMockStore()
  const session = getSessionFromStoreOrThrow(store, sessionId)

  if (!session.recommendation) {
    return buildMockResponse('Generation in progress', {
      session_id: sessionId,
      generation_status: 'in_progress',
    })
  }

  return buildMockResponse('OK', {
    session_id: sessionId,
    analysis_id: session.analysis_id,
    ...session.recommendation,
  }, session.recommendation_source || 'mock')
}

const mockSaveAction = async (sessionId, payload) => {
  const store = readMockStore()
  const session = getSessionFromStoreOrThrow(store, sessionId)

  session.next_action = payload.next_action
  session.updated_at = nowIso()
  writeMockStore(store)

  return buildMockResponse('Action saved', {
    session_id: sessionId,
    next_action: payload.next_action,
    saved_at: nowIso(),
  })
}

const mockSaveFeedback = async (sessionId, payload) => {
  const store = readMockStore()
  const session = getSessionFromStoreOrThrow(store, sessionId)

  session.feedback = {
    relevance_score: payload.relevance_score,
    feedback_note: payload.feedback_note || '',
    saved_at: nowIso(),
  }

  session.updated_at = nowIso()
  writeMockStore(store)

  return buildMockResponse('Feedback saved', {
    session_id: sessionId,
    relevance_score: payload.relevance_score,
    saved_at: session.feedback.saved_at,
  })
}

export const getCareerAdvisorOptions = () =>
  withMockFallback(() => get(`${BASE_PATH}/options`), () => mockGetOptions())

export const createCareerAdvisorSession = (payload) =>
  withMockFallback(() => post(`${BASE_PATH}/sessions`, payload), () => mockCreateSession(payload))

export const updateCareerAdvisorProfile = (sessionId, payload) =>
  withMockFallback(
    () => patch(`${BASE_PATH}/sessions/${encodeURIComponent(sessionId)}/profile`, payload),
    () => mockPatchProfile(sessionId, payload),
  )

export const generateCareerAdvisorResult = (sessionId, payload = {}) =>
  withMockFallback(
    () => post(`${BASE_PATH}/sessions/${encodeURIComponent(sessionId)}/generate`, payload),
    () => mockGenerate(sessionId, payload),
  )

export const getCareerAdvisorResult = (sessionId) =>
  withMockFallback(
    () => get(`${BASE_PATH}/sessions/${encodeURIComponent(sessionId)}/result`),
    () => mockGetResult(sessionId),
  )

export const saveCareerAdvisorAction = (sessionId, payload) =>
  withMockFallback(
    () => post(`${BASE_PATH}/sessions/${encodeURIComponent(sessionId)}/action`, payload),
    () => mockSaveAction(sessionId, payload),
  )

export const saveCareerAdvisorFeedback = (sessionId, payload) =>
  withMockFallback(
    () => post(`${BASE_PATH}/sessions/${encodeURIComponent(sessionId)}/feedback`, payload),
    () => mockSaveFeedback(sessionId, payload),
  )

export default {
  getCareerAdvisorOptions,
  createCareerAdvisorSession,
  updateCareerAdvisorProfile,
  generateCareerAdvisorResult,
  getCareerAdvisorResult,
  saveCareerAdvisorAction,
  saveCareerAdvisorFeedback,
}
