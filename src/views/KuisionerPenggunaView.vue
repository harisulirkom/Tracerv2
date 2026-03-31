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
  answers: {}, // Dynamic answers stored by question ID
})

const success = ref('')
const error = ref('')

const copyByLocale = {
  id: {
    fallbackTitle: 'Kuisioner pengguna alumni',
    fallbackChip: 'Tracer Study - Kuisioner pengguna dibuka',
    fallbackDescription: 'Berikan penilaian terhadap performa alumni dan kebutuhan rekrutmen instansi Anda.',
    estimatedTime: '+/-5 menit',
    surveyTag: 'Kuisioner',
    noActive: 'Belum ada kuisioner aktif untuk kategori ini.',
    loadingQuestions: 'Memuat pertanyaan...',
    chooseOne: 'Pilih salah satu',
    writePrefix: 'Tulis',
    writeAnswer: 'Tulis jawaban Anda...',
    confidentiality: 'Kerahasiaan Terjamin',
    safeData: 'Data Aman',
    submit: 'Kirim Jawaban',
    defaultRespondent: 'Instansi/Pengguna',
    defaultQuestionPrefix: 'Pertanyaan',
    errNotActive: 'Kuisioner pengguna belum aktif. Aktifkan dari admin.',
    errNotAvailable: 'Kuisioner pengguna belum tersedia.',
    errSubmit: 'Gagal mengirim jawaban.',
    successSubmit: 'Terima kasih, penilaian Anda sudah tersimpan.',
  },
  en: {
    fallbackTitle: 'Alumni user questionnaire',
    fallbackChip: 'Tracer Study - User questionnaire is open',
    fallbackDescription: 'Provide an assessment of alumni performance and your institution recruitment needs.',
    estimatedTime: '+/-5 minutes',
    surveyTag: 'Questionnaire',
    noActive: 'There is no active questionnaire for this category.',
    loadingQuestions: 'Loading questions...',
    chooseOne: 'Choose one',
    writePrefix: 'Write',
    writeAnswer: 'Write your answer...',
    confidentiality: 'Confidentiality Protected',
    safeData: 'Data Secured',
    submit: 'Submit Answers',
    defaultRespondent: 'Institution/User',
    defaultQuestionPrefix: 'Question',
    errNotActive: 'User questionnaire is not active yet. Activate it from admin.',
    errNotAvailable: 'User questionnaire is not available yet.',
    errSubmit: 'Failed to submit answers.',
    successSubmit: 'Thank you, your assessment has been saved.',
  },
  ar: {
    fallbackTitle: 'استبيان مستخدمي الخريجين',
    fallbackChip: 'دراسة التتبع - استبيان المستخدمين مفتوح',
    fallbackDescription: 'قدّم تقييمًا لأداء الخريجين واحتياجات التوظيف في مؤسستك.',
    estimatedTime: '+/-5 دقائق',
    surveyTag: 'الاستبيان',
    noActive: 'لا يوجد استبيان نشط لهذه الفئة.',
    loadingQuestions: 'جارٍ تحميل الأسئلة...',
    chooseOne: 'اختر واحدة',
    writePrefix: 'اكتب',
    writeAnswer: 'اكتب إجابتك...',
    confidentiality: 'السرية مضمونة',
    safeData: 'البيانات آمنة',
    submit: 'إرسال الإجابات',
    defaultRespondent: 'الجهة/المستخدم',
    defaultQuestionPrefix: 'السؤال',
    errNotActive: 'استبيان المستخدمين غير نشط بعد. فعّله من لوحة الإدارة.',
    errNotAvailable: 'استبيان المستخدمين غير متاح بعد.',
    errSubmit: 'تعذر إرسال الإجابات.',
    successSubmit: 'شكرًا لك، تم حفظ تقييمك.',
  },
}

const ui = computed(() => copyByLocale[locale.value] || copyByLocale.id)

const fallbackPengguna = computed(() => ({
  title: ui.value.fallbackTitle,
  chipText: ui.value.fallbackChip,
  description: ui.value.fallbackDescription,
  estimatedTime: ui.value.estimatedTime,
}))

const activePengguna = computed(
  () => activeQuestionnairesByAudience.value.pengguna || fallbackPengguna.value,
)

const questionnaireQuestions = computed(() =>
  activePengguna.value?.id ? questionsById(activePengguna.value.id) : [],
)

const headerTitle = computed(() => activePengguna.value?.title || ui.value.fallbackTitle)
const headerChip = computed(() => activePengguna.value?.chipText || ui.value.fallbackChip)
const headerDescription = computed(
  () =>
    activePengguna.value?.description ||
    ui.value.fallbackDescription,
)
const estimatedTimeLabel = computed(() => activePengguna.value?.estimatedTime || ui.value.estimatedTime)
const hasApi = computed(() => Boolean(import.meta.env.VITE_API_BASE_URL))
const disabled = computed(() => hasApi.value && !activePengguna.value?.id)

const getQuestionType = (question = {}) => {
  const type = String(question.tipe || question.type || '').trim().toLowerCase()
  if (type === 'checkbox') return 'multichoice'
  if (type === 'radio') return 'select'
  return type || 'text'
}

const getQuestionId = (question = {}, index = 0) =>
  String(question.id || question.question_id || question.code || `q-${index + 1}`)

const getQuestionLabel = (question = {}, index = 0) =>
  question.pertanyaan || question.label || question.question || `${ui.value.defaultQuestionPrefix} ${index + 1}`

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

const getQuestionPlaceholder = (question = {}, index = 0) =>
  `${ui.value.writePrefix} ${String(getQuestionLabel(question, index)).toLowerCase()}...`

onMounted(async () => {
  await fetchActiveQuestionnaire('pengguna')
  if (activePengguna.value?.id) {
    const questions = await fetchQuestions(activePengguna.value.id)
    questions.forEach((question, index) => {
      const qid = getQuestionId(question, index)
      if (form.answers[qid] === undefined) {
        form.answers[qid] = getQuestionType(question) === 'multichoice' ? [] : ''
      }
    })
  }
})

const resetForm = () => {
  Object.keys(form.answers).forEach((key) => {
    form.answers[key] = Array.isArray(form.answers[key]) ? [] : ''
  })
}

const buildNimFallback = (snapshot) => {
  const firstValue = Object.values(snapshot.answers).find((v) => typeof v === 'string' && v.trim().length > 3)
  const raw = firstValue || 'pengguna'
  const digits = String(raw).replace(/\D/g, '')
  if (digits.length >= 8) return digits
  const cleaned = String(raw).trim().replace(/[^a-zA-Z0-9]/g, '')
  return `PG${cleaned.slice(0, 10)}${Date.now().toString().slice(-6)}`
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
    const questionName = getQuestionLabel(missingRequired)
    error.value =
      locale.value === 'en'
        ? `Question "${questionName}" is required.`
        : locale.value === 'ar'
          ? `السؤال "${questionName}" مطلوب.`
          : `Pertanyaan "${questionName}" wajib diisi.`
    return
  }

  const snapshot = JSON.parse(JSON.stringify(form))
  const respondentCode = buildNimFallback(snapshot)

  if (hasApi.value) {
    if (!activePengguna.value?.id) {
      error.value = ui.value.errNotAvailable
      return
    }

    const answersPayload = {}
    Object.entries(snapshot.answers).forEach(([qId, val]) => {
      answersPayload[String(qId)] = val
    })

    const basePayload = {
      questionnaire_id: activePengguna.value.id,
      answers: answersPayload,
      form_data: { ...snapshot.answers, respondent_code: respondentCode },
      audience: 'pengguna',
      type: 'pengguna_alumni',
      target_audience: 'pengguna',
    }

    try {
      await responseService.submitResponses(basePayload)
    } catch (err) {
      error.value = err?.response?.data?.message || err?.message || ui.value.errSubmit
      return
    }
  }

  await addSubmission(
    {
      type: 'pengguna_alumni',
      audience: 'pengguna',
      nama: Object.values(snapshot.answers)[0] || ui.value.defaultRespondent,
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
</script>

<template>
  <div class="space-y-8">
    <header class="space-y-3">
      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">{{ ui.surveyTag }}</p>
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

    <div v-if="!disabled" class="rounded-3xl border border-slate-200 bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100 p-[1px]">
      <div class="h-full rounded-[22px] bg-white p-8 shadow-sm">
        <form
          class="space-y-6"
          @submit.prevent="onSubmit"
        >
          <div class="mb-6 flex flex-wrap items-center gap-2 border-b border-slate-100 pb-6">
            <div
              class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700"
            >
              <span class="h-2 w-2 rounded-full bg-emerald-500" />
              {{ headerChip }}
            </div>
            <span class="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
              {{ estimatedTimeLabel }}
            </span>
          </div>

          <div class="space-y-8">
             <div v-if="!questionnaireQuestions.length" class="py-12 text-center text-slate-400">
                <p>{{ ui.loadingQuestions }}</p>
             </div>
             
             <div 
               v-for="(q, index) in questionnaireQuestions" 
               :key="getQuestionId(q, index)" 
               class="space-y-3"
             >
                <label class="block text-sm font-bold text-slate-800">
                  {{ getQuestionLabel(q, index) }}
                  <span v-if="isQuestionRequired(q)" class="text-rose-500">*</span>
                </label>

                <div v-if="getQuestionType(q) === 'text'">
                  <input
                    v-model="form.answers[getQuestionId(q, index)]"
                    type="text"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition focus:border-emerald-400 focus:bg-white focus:outline-none"
                    :placeholder="getQuestionPlaceholder(q, index)"
                    :required="isQuestionRequired(q)"
                  />
                </div>

                <div v-else-if="getQuestionType(q) === 'textarea'">
                  <textarea
                    v-model="form.answers[getQuestionId(q, index)]"
                    rows="3"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition focus:border-emerald-400 focus:bg-white focus:outline-none"
                    :placeholder="ui.writeAnswer"
                    :required="isQuestionRequired(q)"
                  />
                </div>

                <div v-else-if="getQuestionType(q) === 'select'">
                  <select
                    v-model="form.answers[getQuestionId(q, index)]"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
                    :required="isQuestionRequired(q)"
                  >
                    <option value="" disabled>{{ ui.chooseOne }}</option>
                    <option v-for="opt in getQuestionOptions(q)" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>

                <div v-else-if="getQuestionType(q) === 'multichoice'" class="grid gap-2 sm:grid-cols-2">
                   <label 
                     v-for="opt in getQuestionOptions(q)" 
                     :key="opt"
                     class="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/30 p-3 text-sm hover:bg-emerald-50 transition"
                   >
                      <input 
                        v-model="form.answers[getQuestionId(q, index)]" 
                        type="checkbox" 
                        :value="opt"
                        class="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span class="text-slate-700">{{ opt }}</span>
                   </label>
                </div>
             </div>
          </div>

          <div class="flex flex-col gap-4 border-t border-slate-100 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
               <span class="rounded-full bg-emerald-50 px-3 py-1.5">{{ ui.confidentiality }}</span>
               <span class="rounded-full bg-emerald-50 px-3 py-1.5">{{ ui.safeData }}</span>
            </div>
            <button
              class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110 active:scale-95 disabled:grayscale"
              type="submit"
              :disabled="disabled"
            >
              {{ ui.submit }}
            </button>
          </div>

          <p v-if="success" class="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 animate-bounce">
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
