<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  createCareerAdvisorSession,
  generateCareerAdvisorResult,
  getCareerAdvisorOptions,
  getCareerAdvisorResult,
  saveCareerAdvisorAction,
  saveCareerAdvisorFeedback,
  updateCareerAdvisorProfile,
} from '@/services/careerAdvisorService'

const options = reactive({
  personas: [],
  industries: [],
  skillLevels: [],
  workStyles: [],
  weeklyHours: [],
  motivators: [],
  supportTypes: [],
})

const optionsState = reactive({
  loading: true,
  error: '',
  source: 'api',
})

const selectedPersonaId = ref('')
const sessionId = ref('')
const isCreatingSession = ref(false)
const isGenerating = ref(false)
const isLoadingResult = ref(false)
const isSavingAction = ref(false)
const isSavingFeedback = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')
const actionMessage = ref('')
const feedbackMessage = ref('')

const profileMeta = ref({
  form_completion_percent: 0,
  confidence_band: 'rendah',
  ready_for_generate: false,
  missing_required_fields: [],
})

const resultData = ref(null)
const feedbackScore = ref(0)
const feedbackNote = ref('')
const selectedAction = ref('')

const form = reactive({
  graduationYear: '',
  studyProgram: '',
  targetIndustry: '',
  targetRole: '',
  skillLevel: '',
  strongestSkill: '',
  biggestGap: '',
  workStyle: '',
  locationPreference: '',
  weeklyHours: '',
  motivator: '',
  careerGoal: '',
  mainConstraint: '',
  supportType: '',
})

const requiredFormFields = [
  'graduationYear',
  'studyProgram',
  'targetIndustry',
  'targetRole',
  'skillLevel',
  'strongestSkill',
  'biggestGap',
  'workStyle',
  'weeklyHours',
  'motivator',
  'careerGoal',
  'supportType',
]

const nextActionOptions = [
  { id: 'apply_now', label: 'Mulai Apply Role' },
  { id: 'book_counseling', label: 'Booking Konseling CDC' },
  { id: 'save_learning_plan', label: 'Simpan Rencana Belajar' },
]

const selectedPersona = computed(() => options.personas.find((item) => item.id === selectedPersonaId.value) || null)
const isPersonaChosen = computed(() => Boolean(selectedPersonaId.value))

const localCompletionPercent = computed(() => {
  const filled = requiredFormFields.reduce((total, key) => (String(form[key] || '').trim() ? total + 1 : total), 0)
  return Math.round((filled / requiredFormFields.length) * 100)
})

const completionPercent = computed(() => Math.max(localCompletionPercent.value, profileMeta.value.form_completion_percent || 0))

const readinessLabel = computed(() => {
  if (profileMeta.value.confidence_band) return profileMeta.value.confidence_band
  if (completionPercent.value < 60) return 'rendah'
  if (completionPercent.value < 85) return 'sedang'
  return 'tinggi'
})

const isFormValid = computed(() => requiredFormFields.every((field) => String(form[field] || '').trim()))

const hasGenerated = computed(() => resultData.value?.generation_status === 'completed')
const sourceLabel = computed(() => {
  if (String(optionsState.source || '').toLowerCase().includes('openai')) return 'API Backend (OpenAI)'
  if (optionsState.source === 'mock') return 'Mock Internal'
  return 'API Backend'
})

const recommendationItems = computed(() => resultData.value?.recommendations || [])
const planItems = computed(() => resultData.value?.plan_12_weeks || [])
const skillGapItems = computed(() => resultData.value?.skill_gap || [])

const userViewPoints = computed(() => {
  if (!hasGenerated.value) return []
  return [
    `Top role dipersonalisasi dari persona ${selectedPersona.value?.label || '-'} dan target ${form.targetRole || '-'}.`,
    `Penjelasan rekomendasi diprioritaskan sesuai motivator ${form.motivator || '-'}.`,
    `Roadmap belajar menyesuaikan komitmen ${form.weeklyHours || '-'} jam per minggu.`,
  ]
})

const systemProcessPoints = computed(() => {
  if (!hasGenerated.value) return []
  return [
    'Sistem menghitung career match dari profil, skill, preferensi kerja, dan motivasi.',
    `Confidence akhir: ${String(resultData.value?.confidence_band || readinessLabel.value).toUpperCase()} (${Math.round((resultData.value?.confidence_score || 0) * 100)}%).`,
    'Rencana 12 minggu dihasilkan agar alumni punya langkah konkret, bukan saran umum.',
  ]
})

const normalizeApiError = (error, fallback = 'Terjadi kesalahan. Coba lagi.') => {
  const apiMessage = error?.response?.data?.message
  if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage
  if (typeof error?.message === 'string' && error.message.trim()) return error.message
  return fallback
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const applySourceTag = (response) => {
  const source = String(response?.data?.source || '').trim()
  if (!source) return
  optionsState.source = source
}

const resetResult = () => {
  resultData.value = null
  selectedAction.value = ''
  feedbackScore.value = 0
  feedbackNote.value = ''
  actionMessage.value = ''
  feedbackMessage.value = ''
}

const resetForm = () => {
  form.graduationYear = ''
  form.studyProgram = ''
  form.targetIndustry = ''
  form.targetRole = ''
  form.skillLevel = ''
  form.strongestSkill = ''
  form.biggestGap = ''
  form.workStyle = ''
  form.locationPreference = ''
  form.weeklyHours = ''
  form.motivator = ''
  form.careerGoal = ''
  form.mainConstraint = ''
  form.supportType = ''
}

const buildProfilePayload = () => ({
  graduation_year: Number(form.graduationYear),
  study_program: form.studyProgram.trim(),
  target_industry: form.targetIndustry,
  target_role: form.targetRole.trim(),
  skill_level: form.skillLevel,
  strongest_skill: form.strongestSkill.trim(),
  biggest_gap: form.biggestGap.trim(),
  work_style: form.workStyle,
  location_preference: form.locationPreference.trim(),
  weekly_hours: form.weeklyHours,
  motivator: form.motivator,
  career_goal: form.careerGoal.trim(),
  main_constraint: form.mainConstraint.trim(),
  support_type: form.supportType,
})

const loadOptions = async () => {
  optionsState.loading = true
  optionsState.error = ''

  try {
    const response = await getCareerAdvisorOptions()
    applySourceTag(response)
    const data = response?.data || {}

    options.personas = Array.isArray(data.personas) ? data.personas : []
    options.industries = Array.isArray(data.industries) ? data.industries : []
    options.skillLevels = Array.isArray(data.skill_levels) ? data.skill_levels : []
    options.workStyles = Array.isArray(data.work_styles) ? data.work_styles : []
    options.weeklyHours = Array.isArray(data.weekly_hours) ? data.weekly_hours : []
    options.motivators = Array.isArray(data.motivators) ? data.motivators : []
    options.supportTypes = Array.isArray(data.support_types) ? data.support_types : []
  } catch (error) {
    optionsState.error = normalizeApiError(error, 'Gagal memuat opsi form AI Career Advisor.')
  } finally {
    optionsState.loading = false
  }
}

const createSession = async (personaId) => {
  if (!personaId) return

  isCreatingSession.value = true
  errorMessage.value = ''
  infoMessage.value = ''

  try {
    const response = await createCareerAdvisorSession({ persona_id: personaId })
    applySourceTag(response)
    sessionId.value = response?.data?.session_id || ''
    profileMeta.value = {
      form_completion_percent: response?.data?.form_completion_percent || 0,
      confidence_band: 'rendah',
      ready_for_generate: false,
      missing_required_fields: [],
    }
    infoMessage.value = sessionId.value
      ? 'Session AI berhasil dibuat. Lanjut isi form wajib.'
      : 'Session belum terbentuk. Coba pilih persona lagi.'
  } catch (error) {
    sessionId.value = ''
    errorMessage.value = normalizeApiError(error, 'Gagal membuat session AI.')
  } finally {
    isCreatingSession.value = false
  }
}

const fetchResultWithPolling = async () => {
  if (!sessionId.value) return false

  isLoadingResult.value = true
  try {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const response = await getCareerAdvisorResult(sessionId.value)
      applySourceTag(response)

      const data = response?.data || {}
      const status = data.generation_status

      if (status === 'completed') {
        resultData.value = data
        return true
      }

      await sleep(850)
    }

    errorMessage.value = 'Hasil AI belum siap. Coba lagi beberapa detik.'
    return false
  } catch (error) {
    errorMessage.value = normalizeApiError(error, 'Gagal mengambil hasil preview AI.')
    return false
  } finally {
    isLoadingResult.value = false
  }
}

const generatePreview = async () => {
  if (!sessionId.value) {
    errorMessage.value = 'Session belum tersedia. Pilih persona terlebih dahulu.'
    return
  }

  if (!isFormValid.value) {
    errorMessage.value = 'Lengkapi semua field wajib sebelum generate preview.'
    return
  }

  isGenerating.value = true
  errorMessage.value = ''
  infoMessage.value = ''

  try {
    const profileResponse = await updateCareerAdvisorProfile(sessionId.value, buildProfilePayload())
    applySourceTag(profileResponse)

    profileMeta.value = {
      form_completion_percent: profileResponse?.data?.form_completion_percent || completionPercent.value,
      confidence_band: profileResponse?.data?.confidence_band || readinessLabel.value,
      ready_for_generate: Boolean(profileResponse?.data?.ready_for_generate),
      missing_required_fields: profileResponse?.data?.missing_required_fields || [],
    }

    if (!profileMeta.value.ready_for_generate) {
      errorMessage.value = 'Profil belum lengkap untuk generate hasil.'
      return
    }

    const generateResponse = await generateCareerAdvisorResult(sessionId.value, { force_regenerate: true })
    applySourceTag(generateResponse)

    const ok = await fetchResultWithPolling()
    if (ok) {
      infoMessage.value = 'Preview AI berhasil dibuat.'
    }
  } catch (error) {
    errorMessage.value = normalizeApiError(error, 'Gagal memproses generate AI preview.')
  } finally {
    isGenerating.value = false
  }
}

const chooseAction = async (actionId) => {
  if (!sessionId.value || !hasGenerated.value) return

  selectedAction.value = actionId
  actionMessage.value = ''
  isSavingAction.value = true

  try {
    await saveCareerAdvisorAction(sessionId.value, { next_action: actionId })
    actionMessage.value = 'Next action berhasil disimpan.'
  } catch (error) {
    actionMessage.value = normalizeApiError(error, 'Gagal menyimpan next action.')
  } finally {
    isSavingAction.value = false
  }
}

const submitFeedback = async () => {
  if (!sessionId.value || !hasGenerated.value) return
  if (!feedbackScore.value) {
    feedbackMessage.value = 'Pilih rating relevansi terlebih dahulu.'
    return
  }

  feedbackMessage.value = ''
  isSavingFeedback.value = true

  try {
    await saveCareerAdvisorFeedback(sessionId.value, {
      relevance_score: feedbackScore.value,
      feedback_note: feedbackNote.value.trim(),
    })
    feedbackMessage.value = 'Feedback berhasil disimpan.'
  } catch (error) {
    feedbackMessage.value = normalizeApiError(error, 'Gagal menyimpan feedback.')
  } finally {
    isSavingFeedback.value = false
  }
}

watch(selectedPersonaId, async (personaId) => {
  errorMessage.value = ''
  infoMessage.value = ''
  sessionId.value = ''
  profileMeta.value = {
    form_completion_percent: 0,
    confidence_band: 'rendah',
    ready_for_generate: false,
    missing_required_fields: [],
  }
  resetForm()
  resetResult()

  if (!personaId) return
  await createSession(personaId)
})

watch(
  form,
  () => {
    resetResult()
    actionMessage.value = ''
    feedbackMessage.value = ''
    errorMessage.value = ''
    infoMessage.value = ''
  },
  { deep: true },
)

onMounted(() => {
  loadOptions()
})
</script>

<template>
  <section class="glass-ai-prototype">
    <div class="orb orb-a" aria-hidden="true" />
    <div class="orb orb-b" aria-hidden="true" />

    <div class="container">
      <header class="glass-card hero">
        <p class="kicker">Internal Prototype</p>
        <h1>AI Career Advisor Journey</h1>
        <p>
          End-to-end preview untuk alur: persona -> form wajib -> generate hasil AI -> action & feedback.
        </p>
        <p class="source-chip">
          Sumber data: <strong>{{ sourceLabel }}</strong>
        </p>
      </header>

      <p v-if="errorMessage" class="alert error">{{ errorMessage }}</p>
      <p v-if="infoMessage" class="alert info">{{ infoMessage }}</p>

      <div class="glass-card step-card">
        <div class="step-head">
          <span class="badge">Langkah 1</span>
          <h2>Pilih Persona View</h2>
        </div>

        <p v-if="optionsState.loading" class="helper">Memuat opsi persona...</p>
        <p v-else-if="optionsState.error" class="helper error-text">{{ optionsState.error }}</p>

        <div class="field-wrap" v-else>
          <label for="persona-select">Persona</label>
          <select id="persona-select" v-model="selectedPersonaId" :disabled="isCreatingSession">
            <option disabled value="">Pilih persona...</option>
            <option v-for="persona in options.personas" :key="persona.id" :value="persona.id">{{ persona.label }}</option>
          </select>
        </div>

        <Transition name="soft-fade">
          <p v-if="selectedPersona" class="persona-note">{{ selectedPersona.summary || 'Persona dipilih.' }}</p>
        </Transition>

        <p v-if="isCreatingSession" class="helper">Membuat session AI...</p>
      </div>

      <Transition name="soft-rise">
        <div v-if="isPersonaChosen" class="glass-card step-card">
          <div class="step-head">
            <span class="badge">Langkah 2</span>
            <h2>Form Wajib (Akurasi Rekomendasi)</h2>
          </div>

          <div class="quality-strip">
            <div>
              <p class="quality-title">Kelengkapan Data: {{ completionPercent }}%</p>
              <p class="quality-caption">Confidence rekomendasi: {{ readinessLabel }}</p>
            </div>
            <div class="progress-track">
              <span class="progress-fill" :style="{ width: `${completionPercent}%` }" />
            </div>
          </div>

          <div class="section-block">
            <h3>Profil Dasar</h3>
            <div class="form-grid">
              <div class="field-wrap">
                <label for="year">Tahun Lulus</label>
                <input id="year" v-model="form.graduationYear" type="number" placeholder="Contoh: 2024" />
              </div>
              <div class="field-wrap">
                <label for="program">Program Studi</label>
                <input id="program" v-model="form.studyProgram" type="text" placeholder="Contoh: Teknik Informatika" />
              </div>
              <div class="field-wrap">
                <label for="industry">Target Industri</label>
                <select id="industry" v-model="form.targetIndustry">
                  <option disabled value="">Pilih industri</option>
                  <option v-for="industry in options.industries" :key="industry" :value="industry">{{ industry }}</option>
                </select>
              </div>
              <div class="field-wrap">
                <label for="role">Target Role</label>
                <input id="role" v-model="form.targetRole" type="text" placeholder="Contoh: Data Analyst Junior" />
              </div>
            </div>
          </div>

          <div class="section-block">
            <h3>Kompetensi dan Preferensi Kerja</h3>
            <div class="form-grid">
              <div class="field-wrap">
                <label for="skill-level">Level Skill Saat Ini</label>
                <select id="skill-level" v-model="form.skillLevel">
                  <option disabled value="">Pilih level</option>
                  <option v-for="level in options.skillLevels" :key="level" :value="level">{{ level }}</option>
                </select>
              </div>
              <div class="field-wrap">
                <label for="strongest">Skill Terkuat Saat Ini</label>
                <input id="strongest" v-model="form.strongestSkill" type="text" placeholder="Contoh: SQL" />
              </div>
              <div class="field-wrap">
                <label for="gap">Skill Gap Terbesar</label>
                <input id="gap" v-model="form.biggestGap" type="text" placeholder="Contoh: Statistik terapan" />
              </div>
              <div class="field-wrap">
                <label for="hours">Jam Belajar per Minggu</label>
                <select id="hours" v-model="form.weeklyHours">
                  <option disabled value="">Pilih alokasi waktu</option>
                  <option v-for="hours in options.weeklyHours" :key="hours" :value="hours">{{ hours }}</option>
                </select>
              </div>
              <div class="field-wrap">
                <label for="style">Gaya Kerja</label>
                <select id="style" v-model="form.workStyle">
                  <option disabled value="">Pilih gaya kerja</option>
                  <option v-for="style in options.workStyles" :key="style" :value="style">{{ style }}</option>
                </select>
              </div>
              <div class="field-wrap">
                <label for="location">Preferensi Lokasi (opsional)</label>
                <input id="location" v-model="form.locationPreference" type="text" placeholder="Contoh: Surabaya / Remote" />
              </div>
            </div>
          </div>

          <div class="section-block">
            <h3>Motivasi dan Dukungan</h3>
            <div class="form-grid">
              <div class="field-wrap">
                <label for="motivator">Motivator Utama</label>
                <select id="motivator" v-model="form.motivator">
                  <option disabled value="">Pilih motivator</option>
                  <option v-for="motivator in options.motivators" :key="motivator" :value="motivator">{{ motivator }}</option>
                </select>
              </div>
              <div class="field-wrap">
                <label for="goal">Tujuan 12 Bulan</label>
                <input id="goal" v-model="form.careerGoal" type="text" placeholder="Contoh: Dapat role entry-level data" />
              </div>
              <div class="field-wrap field-full">
                <label for="constraint">Hambatan Utama (opsional)</label>
                <input id="constraint" v-model="form.mainConstraint" type="text" placeholder="Contoh: Waktu terbatas karena kerja part-time" />
              </div>
              <div class="field-wrap field-full">
                <label>Dukungan yang Diinginkan</label>
                <div class="support-options">
                  <button
                    v-for="option in options.supportTypes"
                    :key="option"
                    type="button"
                    class="support-button"
                    :class="{ active: form.supportType === option }"
                    @click="form.supportType = option"
                  >
                    {{ option }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="cta-row">
            <p class="status-text" :class="{ ready: isFormValid }">
              {{ isFormValid ? 'Semua field wajib lengkap. Siap generate preview AI.' : 'Lengkapi seluruh field wajib untuk akurasi tinggi.' }}
            </p>
            <button type="button" class="primary-btn" :disabled="!isFormValid || isGenerating || isLoadingResult" @click="generatePreview">
              {{ isGenerating || isLoadingResult ? 'Memproses AI...' : 'Tampilkan Preview AI' }}
            </button>
          </div>
        </div>
      </Transition>

      <Transition name="soft-rise">
        <div v-if="hasGenerated" class="glass-card step-card">
          <div class="step-head">
            <span class="badge">Langkah 3</span>
            <h2>Hasil Rekomendasi dan Motivasi</h2>
          </div>

          <section class="mini-card motivation-card">
            <h3>Narasi Personal Alumni</h3>
            <p>{{ resultData?.motivation_narrative }}</p>
          </section>

          <div class="result-grid">
            <section class="mini-card">
              <h3>Yang Dilihat Alumni</h3>
              <ul>
                <li v-for="point in userViewPoints" :key="point">{{ point }}</li>
              </ul>
            </section>
            <section class="mini-card">
              <h3>Proses Sistem</h3>
              <ul>
                <li v-for="point in systemProcessPoints" :key="point">{{ point }}</li>
              </ul>
            </section>
          </div>

          <div class="result-grid">
            <section class="mini-card">
              <h3>Preview Career Match</h3>
              <div class="list-block">
                <article v-for="match in recommendationItems" :key="match.role" class="list-row">
                  <strong>{{ match.role }}</strong>
                  <span>{{ match.score }}%</span>
                  <small>{{ match.eta }}</small>
                  <small>{{ match.reason }}</small>
                </article>
              </div>
            </section>
            <section class="mini-card">
              <h3>Preview Rencana 12 Minggu</h3>
              <div class="list-block">
                <article v-for="plan in planItems" :key="plan.phase" class="list-row">
                  <strong>{{ plan.phase }}</strong>
                  <small>{{ plan.focus }}</small>
                </article>
              </div>
            </section>
          </div>

          <section class="mini-card">
            <h3>Skill Gap Prioritas</h3>
            <ul>
              <li v-for="gap in skillGapItems" :key="gap">{{ gap }}</li>
            </ul>
          </section>
        </div>
      </Transition>

      <Transition name="soft-rise">
        <div v-if="hasGenerated" class="glass-card step-card">
          <div class="step-head">
            <span class="badge">Langkah 4</span>
            <h2>Action dan Feedback</h2>
          </div>

          <div class="action-grid">
            <section class="mini-card">
              <h3>Pilih Next Action</h3>
              <div class="support-options">
                <button
                  v-for="action in nextActionOptions"
                  :key="action.id"
                  type="button"
                  class="support-button"
                  :class="{ active: selectedAction === action.id }"
                  :disabled="isSavingAction"
                  @click="chooseAction(action.id)"
                >
                  {{ action.label }}
                </button>
              </div>
              <p class="helper" v-if="actionMessage">{{ actionMessage }}</p>
            </section>

            <section class="mini-card">
              <h3>Rating Relevansi Rekomendasi</h3>
              <div class="rating-row">
                <button
                  v-for="score in 5"
                  :key="score"
                  type="button"
                  class="rating-dot"
                  :class="{ active: feedbackScore >= score }"
                  :disabled="isSavingFeedback"
                  @click="feedbackScore = score"
                >
                  {{ score }}
                </button>
              </div>

              <div class="field-wrap feedback-note-wrap">
                <label for="feedback-note">Catatan Feedback (opsional)</label>
                <textarea
                  id="feedback-note"
                  v-model="feedbackNote"
                  rows="3"
                  placeholder="Contoh: role pertama sangat relevan, role ketiga kurang sesuai"
                />
              </div>

              <button type="button" class="primary-btn" :disabled="isSavingFeedback" @click="submitFeedback">
                {{ isSavingFeedback ? 'Menyimpan...' : 'Simpan Feedback' }}
              </button>
              <p class="helper" v-if="feedbackMessage">{{ feedbackMessage }}</p>
            </section>
          </div>
        </div>
      </Transition>
    </div>
  </section>
</template>

<style scoped>
.glass-ai-prototype {
  min-height: calc(100vh - 2rem);
  padding: clamp(1rem, 2vw, 1.8rem);
  background:
    radial-gradient(900px 360px at 12% -10%, rgba(110, 231, 183, 0.2), transparent 60%),
    radial-gradient(780px 320px at 88% -12%, rgba(191, 219, 254, 0.24), transparent 58%),
    linear-gradient(165deg, #eaf2ff 0%, #edf7f3 52%, #f2f5fb 100%);
  position: relative;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(30px);
  pointer-events: none;
  opacity: 0.45;
}

.orb-a {
  width: 220px;
  height: 220px;
  background: rgba(56, 189, 248, 0.35);
  top: 8%;
  right: 8%;
  animation: drift 10s ease-in-out infinite;
}

.orb-b {
  width: 280px;
  height: 280px;
  background: rgba(52, 211, 153, 0.26);
  bottom: 5%;
  left: 5%;
  animation: drift 12s ease-in-out infinite reverse;
}

.container {
  position: relative;
  z-index: 1;
  margin: 0 auto;
  max-width: 1080px;
  display: grid;
  gap: 0.9rem;
}

.glass-card {
  background: rgba(255, 255, 255, 0.42);
  border: 1px solid rgba(255, 255, 255, 0.62);
  border-radius: 16px;
  backdrop-filter: blur(14px) saturate(1.2);
  -webkit-backdrop-filter: blur(14px) saturate(1.2);
  box-shadow:
    0 18px 36px -30px rgba(15, 23, 42, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.45);
  padding: clamp(0.9rem, 1.8vw, 1.2rem);
}

.hero {
  display: grid;
  gap: 0.45rem;
}

.kicker {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.1rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #0f766e;
}

.hero h1 {
  margin: 0;
  font-size: clamp(1.3rem, 2.2vw, 1.9rem);
  color: #0f172a;
}

.hero p {
  margin: 0;
  color: #334155;
  line-height: 1.5;
}

.source-chip {
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: #1e293b;
}

.alert {
  margin: 0;
  border-radius: 10px;
  padding: 0.62rem 0.75rem;
  font-size: 0.83rem;
  border: 1px solid;
}

.alert.error {
  background: rgba(254, 226, 226, 0.65);
  border-color: rgba(239, 68, 68, 0.45);
  color: #991b1b;
}

.alert.info {
  background: rgba(219, 234, 254, 0.65);
  border-color: rgba(59, 130, 246, 0.45);
  color: #1e3a8a;
}

.helper {
  margin: 0;
  font-size: 0.8rem;
  color: #475569;
}

.error-text {
  color: #b91c1c;
}

.step-card {
  display: grid;
  gap: 0.8rem;
}

.step-head {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.badge {
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.15);
  color: #0f766e;
  border: 1px solid rgba(15, 118, 110, 0.28);
  padding: 0.24rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 700;
}

.step-head h2 {
  margin: 0;
  font-size: 1.02rem;
  color: #0f172a;
}

.field-wrap {
  display: grid;
  gap: 0.35rem;
}

.field-wrap label {
  font-size: 0.8rem;
  color: #334155;
  font-weight: 600;
}

input,
select,
textarea {
  border: 1px solid rgba(148, 163, 184, 0.44);
  background: rgba(255, 255, 255, 0.72);
  border-radius: 10px;
  padding: 0.55rem 0.65rem;
  color: #0f172a;
  font-size: 0.88rem;
  outline: none;
}

textarea {
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus {
  border-color: rgba(14, 116, 144, 0.7);
  box-shadow: 0 0 0 3px rgba(14, 116, 144, 0.14);
}

.persona-note {
  margin: 0;
  padding: 0.55rem 0.65rem;
  border-radius: 10px;
  background: rgba(240, 249, 255, 0.68);
  border: 1px solid rgba(186, 230, 253, 0.68);
  color: #0f172a;
  font-size: 0.84rem;
}

.quality-strip {
  border: 1px solid rgba(148, 163, 184, 0.38);
  border-radius: 12px;
  padding: 0.65rem;
  background: rgba(255, 255, 255, 0.58);
  display: grid;
  gap: 0.45rem;
}

.quality-title {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
}

.quality-caption {
  margin: 0.1rem 0 0;
  font-size: 0.78rem;
  color: #64748b;
}

.progress-track {
  height: 8px;
  border-radius: 999px;
  background: rgba(203, 213, 225, 0.65);
  overflow: hidden;
}

.progress-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(120deg, #0284c7, #0f766e);
  transition: width 0.28s ease;
}

.section-block {
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.54);
  padding: 0.7rem;
  display: grid;
  gap: 0.55rem;
}

.section-block h3 {
  margin: 0;
  font-size: 0.9rem;
  color: #0f172a;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
}

.field-full {
  grid-column: 1 / -1;
}

.support-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.support-button {
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.44);
  background: rgba(255, 255, 255, 0.7);
  color: #1e293b;
  padding: 0.36rem 0.65rem;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.support-button.active {
  border-color: rgba(14, 116, 144, 0.8);
  background: rgba(186, 230, 253, 0.62);
  color: #0c4a6e;
}

.cta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.status-text {
  margin: 0;
  font-size: 0.82rem;
  color: #64748b;
}

.status-text.ready {
  color: #0f766e;
}

.primary-btn {
  border: 1px solid rgba(14, 116, 144, 0.45);
  background: linear-gradient(120deg, rgba(14, 116, 144, 0.95), rgba(13, 148, 136, 0.9));
  color: white;
  border-radius: 10px;
  padding: 0.5rem 0.8rem;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, filter 0.2s ease;
}

.primary-btn:hover:enabled {
  transform: translateY(-1px);
  filter: brightness(1.04);
}

.primary-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.result-grid,
.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
}

.mini-card {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.56);
  border: 1px solid rgba(255, 255, 255, 0.64);
  padding: 0.75rem;
}

.motivation-card p {
  margin: 0.5rem 0 0;
  font-size: 0.85rem;
  line-height: 1.55;
  color: #334155;
}

.mini-card h3 {
  margin: 0;
  font-size: 0.9rem;
  color: #0f172a;
}

.mini-card ul {
  margin: 0.5rem 0 0;
  padding-left: 1rem;
  display: grid;
  gap: 0.28rem;
}

.mini-card li {
  color: #334155;
  font-size: 0.82rem;
  line-height: 1.45;
}

.list-block {
  margin-top: 0.5rem;
  display: grid;
  gap: 0.5rem;
}

.list-row {
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(255, 255, 255, 0.72);
  padding: 0.5rem;
  display: grid;
  gap: 0.2rem;
}

.list-row strong {
  font-size: 0.83rem;
  color: #0f172a;
}

.list-row span {
  width: fit-content;
  border-radius: 999px;
  border: 1px solid rgba(14, 116, 144, 0.35);
  color: #0c4a6e;
  background: rgba(186, 230, 253, 0.56);
  font-size: 0.74rem;
  font-weight: 700;
  padding: 0.1rem 0.45rem;
}

.list-row small {
  color: #475569;
  font-size: 0.78rem;
}

.feedback-note-wrap {
  margin-top: 0.7rem;
}

.rating-row {
  margin-top: 0.55rem;
  display: flex;
  gap: 0.35rem;
}

.rating-dot {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.46);
  background: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  font-weight: 700;
  color: #334155;
}

.rating-dot.active {
  border-color: rgba(14, 116, 144, 0.8);
  background: rgba(186, 230, 253, 0.65);
  color: #0c4a6e;
}

.soft-fade-enter-active,
.soft-fade-leave-active {
  transition: opacity 0.35s ease;
}

.soft-fade-enter-from,
.soft-fade-leave-to {
  opacity: 0;
}

.soft-rise-enter-active,
.soft-rise-leave-active {
  transition: opacity 0.45s ease, transform 0.45s ease, filter 0.45s ease;
}

.soft-rise-enter-from,
.soft-rise-leave-to {
  opacity: 0;
  transform: translateY(8px);
  filter: blur(4px);
}

@keyframes drift {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}

@media (max-width: 900px) {
  .form-grid,
  .result-grid,
  .action-grid {
    grid-template-columns: 1fr;
  }
}
</style>
