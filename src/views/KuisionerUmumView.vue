<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSubmissions } from '../stores/submissions'
import { useQuestionnaires } from '../stores/questionnaires'
import responseService from '@/services/responseService'

const { locale } = useI18n()
const { addSubmission } = useSubmissions()
const { activeQuestionnairesByAudience, fetchActiveQuestionnaire, fetchQuestions, questionsById } =
  useQuestionnaires()

const form = reactive({
  answers: {},
})

const success = ref('')
const error = ref('')

const copyByLocale = {
  id: {
    fallbackTitle: 'Kuisioner umum',
    fallbackChip: 'Kuisioner umum dibuka',
    fallbackDescription: 'Gunakan kuisioner ini untuk survei umum sesuai konfigurasi pertanyaan dari admin.',
    estimatedTime: '+/-5 menit',
    surveyTag: 'Kuisioner',
    noActive: 'Belum ada kuisioner aktif untuk kategori ini.',
    noQuestions: 'Belum ada pertanyaan untuk kuisioner umum.',
    writeAnswer: 'Tulis jawaban Anda...',
    chooseOne: 'Pilih salah satu',
    confidentiality: 'Kerahasiaan Terjamin',
    safeData: 'Data Aman',
    submit: 'Kirim Jawaban',
    questionPrefix: 'Pertanyaan',
    writePrefix: 'Tulis',
    respondentDefault: 'Responden Umum',
    errNotActive: 'Kuisioner umum belum aktif. Aktifkan dari admin.',
    errNotAvailable: 'Kuisioner umum belum tersedia.',
    errSubmit: 'Gagal mengirim jawaban.',
    successSubmit: 'Terima kasih, jawaban kuisioner umum sudah tersimpan.',
  },
  en: {
    fallbackTitle: 'General questionnaire',
    fallbackChip: 'General questionnaire is open',
    fallbackDescription: 'Use this questionnaire for general surveys based on question settings from admin.',
    estimatedTime: '+/-5 minutes',
    surveyTag: 'Questionnaire',
    noActive: 'There is no active questionnaire for this category.',
    noQuestions: 'No questions available for the general questionnaire.',
    writeAnswer: 'Write your answer...',
    chooseOne: 'Choose one',
    confidentiality: 'Confidentiality Protected',
    safeData: 'Data Secured',
    submit: 'Submit Answers',
    questionPrefix: 'Question',
    writePrefix: 'Write',
    respondentDefault: 'General Respondent',
    errNotActive: 'General questionnaire is not active yet. Activate it from admin.',
    errNotAvailable: 'General questionnaire is not available yet.',
    errSubmit: 'Failed to submit answers.',
    successSubmit: 'Thank you, your general questionnaire answers have been saved.',
  },
  ar: {
    fallbackTitle: 'الاستبيان العام',
    fallbackChip: 'الاستبيان العام مفتوح',
    fallbackDescription: 'استخدم هذا الاستبيان للمسوحات العامة وفق إعدادات الأسئلة من الإدارة.',
    estimatedTime: '+/-5 دقائق',
    surveyTag: 'الاستبيان',
    noActive: 'لا يوجد استبيان نشط لهذه الفئة.',
    noQuestions: 'لا توجد أسئلة متاحة للاستبيان العام.',
    writeAnswer: 'اكتب إجابتك...',
    chooseOne: 'اختر واحدة',
    confidentiality: 'السرية مضمونة',
    safeData: 'البيانات آمنة',
    submit: 'إرسال الإجابات',
    questionPrefix: 'السؤال',
    writePrefix: 'اكتب',
    respondentDefault: 'مستجيب عام',
    errNotActive: 'الاستبيان العام غير نشط بعد. فعّله من لوحة الإدارة.',
    errNotAvailable: 'الاستبيان العام غير متاح بعد.',
    errSubmit: 'تعذر إرسال الإجابات.',
    successSubmit: 'شكرًا لك، تم حفظ إجابات الاستبيان العام.',
  },
}

const ui = computed(() => copyByLocale[locale.value] || copyByLocale.id)

const fallbackUmum = computed(() => ({
  title: ui.value.fallbackTitle,
  chipText: ui.value.fallbackChip,
  description: ui.value.fallbackDescription,
  estimatedTime: ui.value.estimatedTime,
}))

const activeUmum = computed(() => activeQuestionnairesByAudience.value.umum || fallbackUmum.value)

const questionnaireQuestions = computed(() =>
  activeUmum.value?.id ? questionsById(activeUmum.value.id) : [],
)

const headerTitle = computed(() => activeUmum.value?.title || ui.value.fallbackTitle)
const headerChip = computed(() => activeUmum.value?.chipText || ui.value.fallbackChip)
const headerDescription = computed(
  () =>
    activeUmum.value?.description ||
    ui.value.fallbackDescription,
)
const estimatedTimeLabel = computed(() => activeUmum.value?.estimatedTime || ui.value.estimatedTime)
const hasApi = computed(() => Boolean(import.meta.env.VITE_API_BASE_URL))
const disabled = computed(() => hasApi.value && !activeUmum.value?.id)

const getQuestionType = (question = {}) => {
  const type = String(question.tipe || question.type || '').trim().toLowerCase()
  if (type === 'checkbox') return 'multichoice'
  if (type === 'radio') return 'select'
  return type || 'text'
}

const getQuestionLabel = (question = {}, index = 0) =>
  question.pertanyaan || question.label || question.question || `${ui.value.questionPrefix} ${index + 1}`

const getQuestionId = (question = {}, index = 0) =>
  String(question.id || question.question_id || question.code || `q-${index + 1}`)

const getQuestionPlaceholder = (question = {}, index = 0) =>
  `${ui.value.writePrefix} ${String(getQuestionLabel(question, index)).toLowerCase()}...`

const isQuestionRequired = (question = {}) =>
  Boolean(question.is_required || question.required || question.isRequired)

const getQuestionOptions = (question = {}) => {
  if (Array.isArray(question.pilihan)) return question.pilihan
  if (Array.isArray(question.options)) return question.options
  if (typeof question.pilihan === 'string') {
    return question.pilihan
      .split(';')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

const initAnswers = (questions = []) => {
  questions.forEach((question, index) => {
    const questionId = getQuestionId(question, index)
    const questionType = getQuestionType(question)
    if (form.answers[questionId] !== undefined) return
    form.answers[questionId] = questionType === 'multichoice' ? [] : ''
  })
}

const resetForm = () => {
  Object.keys(form.answers).forEach((key) => {
    form.answers[key] = Array.isArray(form.answers[key]) ? [] : ''
  })
}

const buildRespondentName = (snapshot) => {
  const firstText = Object.values(snapshot.answers).find(
    (value) => typeof value === 'string' && value.trim().length > 0,
  )
  if (firstText) return firstText.trim()
  return ui.value.respondentDefault
}

const buildIdentifierFallback = (snapshot) => {
  const firstText = Object.values(snapshot.answers).find(
    (value) => typeof value === 'string' && value.trim().length > 3,
  )
  const raw = firstText || 'umum'
  const digits = String(raw).replace(/\D/g, '')
  if (digits.length >= 8) return digits
  const cleaned = String(raw).trim().replace(/[^a-zA-Z0-9]/g, '')
  return `UM${cleaned.slice(0, 10)}${Date.now().toString().slice(-6)}`
}

const onSubmit = async () => {
  error.value = ''
  success.value = ''

  if (disabled.value) {
    error.value = ui.value.errNotActive
    return
  }

  const missingRequired = questionnaireQuestions.value.find((question, index) => {
    if (!isQuestionRequired(question)) return false
    const answer = form.answers[getQuestionId(question, index)]
    if (Array.isArray(answer)) return answer.length === 0
    return !String(answer || '').trim()
  })
  if (missingRequired) {
    error.value =
      locale.value === 'en'
        ? `Question "${getQuestionLabel(missingRequired)}" is required.`
        : locale.value === 'ar'
          ? `السؤال "${getQuestionLabel(missingRequired)}" مطلوب.`
          : `Pertanyaan "${getQuestionLabel(missingRequired)}" wajib diisi.`
    return
  }

  const snapshot = JSON.parse(JSON.stringify(form))
  const respondentName = buildRespondentName(snapshot)
  const respondentCode = buildIdentifierFallback(snapshot)

  if (hasApi.value) {
    if (!activeUmum.value?.id) {
      error.value = ui.value.errNotAvailable
      return
    }

    const answersPayload = {}
    Object.entries(snapshot.answers).forEach(([questionId, value]) => {
      answersPayload[String(questionId)] = value
    })

    const apiPayload = {
      questionnaire_id: activeUmum.value.id,
      answers: answersPayload,
      form_data: { ...snapshot.answers, nama: respondentName, respondent_code: respondentCode },
      audience: 'umum',
      type: 'umum',
      target_audience: 'umum',
      nama: respondentName,
    }

    try {
      await responseService.submitResponses(apiPayload)
    } catch (err) {
      error.value = err?.response?.data?.message || err?.message || ui.value.errSubmit
      return
    }
  }

  await addSubmission(
    {
      type: 'umum',
      audience: 'umum',
      nama: respondentName,
      nim: respondentCode,
      raw: snapshot.answers,
    },
    { skipApi: true },
  )

  success.value = ui.value.successSubmit
  resetForm()
  setTimeout(() => {
    success.value = ''
  }, 3000)
}

onMounted(async () => {
  await fetchActiveQuestionnaire('umum')
  if (!activeUmum.value?.id) return
  const questions = await fetchQuestions(activeUmum.value.id)
  initAnswers(Array.isArray(questions) ? questions : [])
})
</script>

<template>
  <div class="space-y-8">
    <header class="space-y-3">
      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">{{ ui.surveyTag }}</p>
      <h1 class="text-3xl font-semibold text-slate-900">
        {{ headerTitle }}
      </h1>
      <p class="text-slate-600">
        {{ headerDescription }}
      </p>
      <p v-if="disabled" class="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
        {{ ui.noActive }}
      </p>
    </header>

    <div
      v-if="!disabled"
      class="rounded-3xl border border-slate-200 bg-gradient-to-r from-cyan-100 via-sky-100 to-blue-100 p-[1px]"
    >
      <div class="h-full rounded-[22px] bg-white p-8 shadow-sm">
        <form class="space-y-6" @submit.prevent="onSubmit">
          <div class="mb-6 flex flex-wrap items-center gap-2 border-b border-slate-100 pb-6">
            <div
              class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700"
            >
              <span class="h-2 w-2 rounded-full bg-cyan-600" />
              {{ headerChip }}
            </div>
            <span class="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-bold text-cyan-700">
              {{ estimatedTimeLabel }}
            </span>
          </div>

          <div class="space-y-8">
            <div v-if="!questionnaireQuestions.length" class="py-12 text-center text-slate-400">
              <p>{{ ui.noQuestions }}</p>
            </div>

            <div
              v-for="(question, index) in questionnaireQuestions"
              :key="getQuestionId(question, index)"
              class="space-y-3"
            >
              <label class="block text-sm font-bold text-slate-800">
                {{ getQuestionLabel(question, index) }}
                <span v-if="isQuestionRequired(question)" class="text-rose-500">*</span>
              </label>

              <div v-if="getQuestionType(question) === 'text'">
                <input
                  v-model="form.answers[getQuestionId(question, index)]"
                  type="text"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition focus:border-cyan-400 focus:bg-white focus:outline-none"
                  :placeholder="getQuestionPlaceholder(question, index)"
                  :required="isQuestionRequired(question)"
                />
              </div>

              <div v-else-if="getQuestionType(question) === 'textarea'">
                <textarea
                  v-model="form.answers[getQuestionId(question, index)]"
                  rows="3"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition focus:border-cyan-400 focus:bg-white focus:outline-none"
                  :placeholder="ui.writeAnswer"
                  :required="isQuestionRequired(question)"
                />
              </div>

              <div v-else-if="getQuestionType(question) === 'select'">
                <select
                  v-model="form.answers[getQuestionId(question, index)]"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-cyan-400 focus:bg-white focus:outline-none"
                  :required="isQuestionRequired(question)"
                >
                  <option value="" disabled>{{ ui.chooseOne }}</option>
                  <option v-for="opt in getQuestionOptions(question)" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </div>

              <div
                v-else-if="getQuestionType(question) === 'multichoice'"
                class="grid gap-2 sm:grid-cols-2"
              >
                <label
                  v-for="opt in getQuestionOptions(question)"
                  :key="opt"
                  class="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/30 p-3 text-sm transition hover:bg-cyan-50"
                >
                  <input
                    v-model="form.answers[getQuestionId(question, index)]"
                    type="checkbox"
                    :value="opt"
                    class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span class="text-slate-700">{{ opt }}</span>
                </label>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-4 border-t border-slate-100 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-cyan-700">
              <span class="rounded-full bg-cyan-50 px-3 py-1.5">{{ ui.confidentiality }}</span>
              <span class="rounded-full bg-cyan-50 px-3 py-1.5">{{ ui.safeData }}</span>
            </div>
            <button
              class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:brightness-110 active:scale-95 disabled:grayscale"
              type="submit"
              :disabled="disabled"
            >
              {{ ui.submit }}
            </button>
          </div>

          <p
            v-if="success"
            class="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
          >
            {{ success }}
          </p>
          <p v-if="error" class="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {{ error }}
          </p>
        </form>
      </div>
    </div>
  </div>
</template>
