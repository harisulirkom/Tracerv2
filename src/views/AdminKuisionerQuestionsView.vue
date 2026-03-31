<script setup>
import { computed, reactive, ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuestionnaires } from '../stores/questionnaires'
import tracerService from '../services/tracerService'
import AdminShell from '../components/AdminShell.vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'

const route = useRoute()
const router = useRouter()
const {
  questionnaires,
  updateQuestionnaireApi,
  fetchQuestionnaires,
  fetchQuestions,
  questionsById,
  questionsLoading,
} = useQuestionnaires()

const questionnaireId = computed(() => String(route.params.id ?? ''))

const questionnaire = computed(() =>
  questionnaires.value.find((item) => String(item.id) === questionnaireId.value),
)

const notFound = computed(() => !questionnaire.value)

const saving = ref(false)
const message = ref('')
const error = ref('')

const statusChoices = [
  { value: 'all', label: 'Semua status' },
  { value: 'umum', label: 'Umum' },
  { value: 'pengguna', label: 'Pengguna alumni' },
  { value: 'bekerja', label: 'Bekerja (full time / part time)' },
  { value: 'wiraswasta', label: 'Wiraswasta' },
  { value: 'melanjutkan_pendidikan', label: 'Melanjutkan pendidikan' },
  { value: 'mencari_kerja', label: 'Tidak bekerja tetapi sedang mencari kerja' },
  { value: 'belum_bekerja', label: 'Belum memungkinkan untuk bekerja' },
]

const extraQuestions = ref([])

const showQuestionModal = ref(false)
const showBankSoalModal = ref(false)
const showDeleteModal = ref(false)
const deleteIndex = ref(null)
const tabContainerRef = ref(null)
const tabRefs = ref([])
const tabIndicator = reactive({ left: 0, top: 0, width: 0, height: 0 })
const activeTabKey = ref('questions')

const bankSoalQuestions = ref([])
const bankSoalLoading = ref(false)
const bankSoalError = ref('')
const bankSearchQuery = ref('')
const bankFilterTarget = ref('all')
const bankFilterStatus = ref('all')
const bankFilterType = ref('all')
const bankCurrentPage = ref(1)
const BANK_PAGE_SIZE = 10

const pageLoading = computed(() => saving.value || questionsLoading.value)

const modalQuestion = reactive({
  label: '',
  type: 'text',
  optionsText: '',
  required: false,
  statusCondition: 'all',
  questionBankItemId: null,
})

const bankTargetOptions = [
  { value: 'all', label: 'Semua target' },
  { value: 'alumni', label: 'Alumni' },
  { value: 'pengguna', label: 'Pengguna alumni' },
  { value: 'umum', label: 'Umum' },
]

const bankStatusOptions = [
  { value: 'all', label: 'Semua status' },
  { value: 'umum', label: 'Umum' },
  { value: 'bekerja', label: 'Bekerja' },
  { value: 'wiraswasta', label: 'Wirausaha' },
  { value: 'melanjutkan', label: 'Studi lanjut' },
  { value: 'mencari', label: 'Mencari kerja' },
  { value: 'belum', label: 'Belum memungkinkan bekerja' },
  { value: 'pengguna', label: 'Pengguna alumni' },
]

const bankTypeOptions = [
  { value: 'all', label: 'Semua tipe' },
  { value: 'text', label: 'Teks singkat' },
  { value: 'textarea', label: 'Teks panjang' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio' },
  { value: 'number', label: 'Angka' },
  { value: 'date', label: 'Tanggal' },
]

const parseMetaObject = (rawMeta) => {
  if (rawMeta && typeof rawMeta === 'object') return rawMeta
  if (typeof rawMeta === 'string') {
    try {
      const parsed = JSON.parse(rawMeta)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch (err) {
      return {}
    }
  }
  return {}
}

const normalizeAudience = (audience) => {
  const value = String(audience || '').trim().toLowerCase()
  if (!value) return 'all'
  if (value.includes('pengguna')) return 'pengguna'
  if (value.includes('umum')) return 'umum'
  if (value.includes('alumni')) return 'alumni'
  return 'all'
}

const normalizeStatusFilterValue = (status) => {
  const value = String(status || '').trim().toLowerCase()
  if (!value) return 'all'
  if (value === 'all') return 'all'
  if (value.includes('pengguna')) return 'pengguna'
  if (value.includes('umum')) return 'umum'
  if (value.includes('wiras')) return 'wiraswasta'
  if (value.includes('melanjut')) return 'melanjutkan'
  if (value.includes('mencari')) return 'mencari'
  if (value.includes('belum')) return 'belum'
  if (value.includes('bekerja')) return 'bekerja'
  return value
}

const normalizeStatusForQuestion = (status) => {
  const value = String(status || '').trim().toLowerCase()
  if (!value || value === 'all') return 'all'
  if (value.includes('pengguna')) return 'pengguna'
  if (value.includes('umum')) return 'umum'
  if (value.includes('wiras')) return 'wiraswasta'
  if (value.includes('melanjut')) return 'melanjutkan_pendidikan'
  if (value.includes('mencari')) return 'mencari_kerja'
  if (value.includes('belum')) return 'belum_bekerja'
  if (value.includes('bekerja')) return 'bekerja'
  return 'all'
}

const normalizeQuestionType = (type) => {
  const value = String(type || '').trim().toLowerCase()
  if (!value) return 'text'
  if (value === 'multichoice') return 'checkbox'
  if (value === 'paragraph') return 'textarea'
  if (value === 'multiple_choice') return 'checkbox'
  if (value === 'single_choice') return 'radio'
  return value
}

const normalizeOptionList = (rawOptions) => {
  if (Array.isArray(rawOptions)) {
    return rawOptions.map((opt) => String(opt).trim()).filter(Boolean)
  }
  if (typeof rawOptions === 'string') {
    return rawOptions
      .split(/[;\n]/)
      .map((opt) => opt.trim())
      .filter(Boolean)
  }
  return []
}

const isLikelyQuestionItem = (item) => {
  if (!item || typeof item !== 'object') return false
  const keys = Object.keys(item)
  return keys.some((key) =>
    [
      'pertanyaan',
      'question',
      'question_text',
      'text',
      'label',
      'tipe',
      'type',
      'question_type',
      'pilihan',
      'options',
      'choices',
      'metadata',
    ].includes(String(key).toLowerCase()),
  )
}

const extractQuestionBankList = (payload) => {
  if (!payload) return []
  const visited = new Set()

  const walk = (node) => {
    if (!node) return null

    if (Array.isArray(node)) {
      if (!node.length) return null
      if (node.some(isLikelyQuestionItem)) return node
      for (const entry of node) {
        const nested = walk(entry)
        if (nested?.length) return nested
      }
      return null
    }

    if (typeof node !== 'object') return null
    if (visited.has(node)) return null
    visited.add(node)

    const preferredKeys = [
      'data',
      'items',
      'rows',
      'results',
      'result',
      'list',
      'payload',
      'question_bank',
      'questionBank',
      'questions',
    ]
    for (const key of preferredKeys) {
      if (!(key in node)) continue
      const nested = walk(node[key])
      if (nested?.length) return nested
    }

    for (const value of Object.values(node)) {
      const nested = walk(value)
      if (nested?.length) return nested
    }

    return null
  }

  const extracted = walk(payload)
  if (!Array.isArray(extracted)) return []
  return extracted.filter((item) => item && typeof item === 'object')
}

const getBankQuestionType = (item) =>
  normalizeQuestionType(item?.tipe || item?.type || item?.question_type || item?.questionType || 'text')

const getBankQuestionText = (item) =>
  String(
    item?.pertanyaan ||
      item?.question ||
      item?.question_text ||
      item?.pertanyaan_text ||
      item?.text ||
      item?.label ||
      item?.title ||
      '',
  ).trim()

const getBankQuestionOptions = (item) =>
  normalizeOptionList(item?.pilihan || item?.options || item?.choices || item?.question_options || [])

const getBankMeta = (item) => {
  const meta = parseMetaObject(item?.metadata)
  return {
    statusGroup: normalizeStatusFilterValue(
      meta.statusGroup ||
        meta.status_group ||
        meta.status ||
        item.statusGroup ||
        item.status_group ||
        item.status_condition ||
        item.status,
    ),
    target: normalizeAudience(
      meta.target ||
        meta.audience ||
        meta.target_responden ||
        item.target ||
        item.audience ||
        item.targetAudience ||
        item.target_responden,
    ),
    category: meta.category || item.category || '',
  }
}

const filteredBankSoalQuestions = computed(() => {
  const q = bankSearchQuery.value.trim().toLowerCase()
  return bankSoalQuestions.value.filter((item) => {
    const meta = getBankMeta(item)
    const questionText = getBankQuestionText(item).toLowerCase()
    const categoryText = String(meta.category || '').toLowerCase()
    const typeValue = getBankQuestionType(item)
    const statusValue = String(meta.statusGroup || '').toLowerCase()
    const targetValue = String(meta.target || '').toLowerCase()

    const matchSearch = !q || questionText.includes(q) || categoryText.includes(q)
    const matchTarget =
      bankFilterTarget.value === 'all' || targetValue === 'all' || targetValue === bankFilterTarget.value
    const matchStatus =
      bankFilterStatus.value === 'all' || statusValue === 'all' || statusValue === bankFilterStatus.value
    const matchType = bankFilterType.value === 'all' || typeValue === bankFilterType.value

    return matchSearch && matchTarget && matchStatus && matchType
  })
})

const bankTotalPages = computed(() =>
  Math.max(1, Math.ceil(filteredBankSoalQuestions.value.length / BANK_PAGE_SIZE)),
)

const paginatedBankSoalQuestions = computed(() => {
  const start = (bankCurrentPage.value - 1) * BANK_PAGE_SIZE
  return filteredBankSoalQuestions.value.slice(start, start + BANK_PAGE_SIZE)
})

const bankShowingRange = computed(() => {
  const total = filteredBankSoalQuestions.value.length
  if (!total) return { start: 0, end: 0, total: 0 }
  const start = (bankCurrentPage.value - 1) * BANK_PAGE_SIZE + 1
  const end = Math.min(total, start + BANK_PAGE_SIZE - 1)
  return { start, end, total }
})

const bankGoPrev = () => {
  if (bankCurrentPage.value <= 1) return
  bankCurrentPage.value -= 1
}

const bankGoNext = () => {
  if (bankCurrentPage.value >= bankTotalPages.value) return
  bankCurrentPage.value += 1
}

const setTabRef = (el, index) => {
  if (el) tabRefs.value[index] = el
}

const updateTabIndicator = () => {
  nextTick(() => {
    const index = activeTabKey.value === 'detail' ? 0 : 1
    const tabEl = tabRefs.value[index]
    if (!tabContainerRef.value || !tabEl) return
    const containerRect = tabContainerRef.value.getBoundingClientRect()
    const tabRect = tabEl.getBoundingClientRect()
    tabIndicator.left = tabRect.left - containerRect.left
    tabIndicator.top = tabRect.top - containerRect.top
    tabIndicator.width = tabRect.width
    tabIndicator.height = tabRect.height
  })
}

const loadData = async () => {
  saving.value = true
  error.value = ''
  message.value = ''
  try {
    if (!questionnaires.value.length) {
      await fetchQuestionnaires()
    }
    if (questionnaire.value) {
      const resp = await fetchQuestions(questionnaireId.value)
      const baseQuestions = Array.isArray(resp) ? resp : []

      extraQuestions.value = baseQuestions.map((q) => ({
        id: q.id || 'new_' + Math.random(),
        code: q.code || null,
        label: q.label || q.pertanyaan || q.question || '',
        type: q.type || q.tipe || 'text',
        required: !!(q.required || q.is_required || q.isRequired),
        statusCondition: q.statusCondition || q.status_condition || 'all',
        questionBankItemId: q.questionBankItemId || q.question_bank_item_id || null,
        options: Array.isArray(q.options) ? q.options : (Array.isArray(q.pilihan) ? q.pilihan : []),
        optionsText: Array.isArray(q.options) ? q.options.join(' ; ') : (Array.isArray(q.pilihan) ? q.pilihan.join(' ; ') : ''),
      }))
    }
  } catch (err) {
    error.value = err?.message || 'Gagal memuat pertanyaan'
  } finally {
    saving.value = false
  }
}

const openAddQuestion = () => {
  modalQuestion.label = ''
  modalQuestion.type = 'text'
  modalQuestion.optionsText = ''
  modalQuestion.required = false
  modalQuestion.statusCondition = 'all'
  modalQuestion.questionBankItemId = null
  showQuestionModal.value = true
}

const openBankSoalPicker = async () => {
  bankSearchQuery.value = ''
  bankSoalError.value = ''
  bankCurrentPage.value = 1
  bankFilterTarget.value = 'all'
  bankFilterStatus.value = 'all'
  bankFilterType.value = 'all'
  showBankSoalModal.value = true
  bankSoalLoading.value = true
  try {
    const resp = await tracerService.getQuestionBank()
    bankSoalQuestions.value = extractQuestionBankList(resp)
  } catch (err) {
    bankSoalError.value = err?.message || 'Gagal memuat bank soal.'
  } finally {
    bankSoalLoading.value = false
  }
}

watch([bankSearchQuery, bankFilterTarget, bankFilterStatus, bankFilterType], () => {
  bankCurrentPage.value = 1
})

watch(bankTotalPages, (total) => {
  if (bankCurrentPage.value > total) {
    bankCurrentPage.value = total
  }
})

const selectFromBankSoal = (item) => {
  modalQuestion.label = getBankQuestionText(item)
  let mappedType = getBankQuestionType(item)
  if (mappedType === 'checkbox') mappedType = 'multichoice'
  if (mappedType === 'radio') mappedType = 'select'
  
  modalQuestion.type = mappedType
  modalQuestion.required = item.is_required ?? false
  const meta = getBankMeta(item)
  modalQuestion.statusCondition = normalizeStatusForQuestion(meta.statusGroup)
  modalQuestion.optionsText = getBankQuestionOptions(item).join(' ; ')
  modalQuestion.questionBankItemId = item.id
  showBankSoalModal.value = false
  showQuestionModal.value = true
}

const confirmAddQuestion = () => {
  // eslint-disable-next-line no-alert
  const confirmed = window.confirm('Apakah Anda yakin menyimpan?')
  if (!confirmed) return

  const newId = 'new_' + Date.now()
  const parsedOptions = parseOptions(modalQuestion.optionsText)

  extraQuestions.value.push({
    id: newId,
    code: null,
    label: modalQuestion.label,
    type: modalQuestion.type,
    required: modalQuestion.required,
    statusCondition: modalQuestion.statusCondition,
    questionBankItemId: modalQuestion.questionBankItemId,
    options: parsedOptions,
    optionsText: modalQuestion.optionsText,
  })

  showQuestionModal.value = false
}

const askDeleteQuestion = (index) => {
  deleteIndex.value = index
  showDeleteModal.value = true
}

const confirmDeleteQuestion = () => {
  if (deleteIndex.value !== null) {
    extraQuestions.value.splice(deleteIndex.value, 1)
  }
  showDeleteModal.value = false
  deleteIndex.value = null
}

const moveQuestion = (fromIndex, toIndex) => {
  if (toIndex < 0 || toIndex >= extraQuestions.value.length) return
  const item = extraQuestions.value.splice(fromIndex, 1)[0]
  extraQuestions.value.splice(toIndex, 0, item)
}

const parseOptions = (raw) =>
  (raw || '')
    .split(';')
    .map((v) => v.trim())
    .filter((v) => v.length > 0)

const handleSave = async () => {
  if (!questionnaire.value) return
  message.value = ''
  error.value = ''
  // eslint-disable-next-line no-alert
  const confirmed = window.confirm('Apakah Anda yakin menyimpan?')
  if (!confirmed) return

  saving.value = true

  try {
    const serialized = extraQuestions.value.map((q, index) => ({
      pertanyaan: q.label || '',
      tipe: q.type || 'text',
      is_required: !!q.required,
      status_condition: q.statusCondition || 'all',
      urutan: index + 1,
      code: q.code || null,
      question_bank_item_id: q.questionBankItemId,
      pilihan: parseOptions(q.optionsText),
    }))

    await updateQuestionnaireApi(questionnaire.value.id, {
      questions: serialized,
      extraQuestions: [],
    })
    
    message.value = 'Pertanyaan kuisioner berhasil disimpan.'
    setTimeout(() => {
      message.value = ''
    }, 3000)
    
    await loadData()
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || 'Terjadi kesalahan saat menyimpan pertanyaan kuisioner.'
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  router.push({ name: 'AdminKuisioner' })
}

const resolvePublicPreviewPath = () => {
  const audience = String(questionnaire.value?.audience || '').trim().toLowerCase()
  if (audience.includes('pengguna')) return '/kuisioner/pengguna'
  if (audience.includes('umum')) return '/kuisioner/umum'
  return '/kuisioner/alumni'
}

const goPreview = () => {
  const targetPath = resolvePublicPreviewPath()
  const resolved = router.resolve({ path: targetPath })
  window.open(resolved.href, '_blank', 'noopener,noreferrer')
}

onMounted(() => {
  loadData()
  updateTabIndicator()
  window.addEventListener('resize', updateTabIndicator)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateTabIndicator)
})
</script>

<template>
  <AdminShell>
    <div class="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
      <header class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Kuisioner</p>
          <h1 class="mt-1 text-2xl font-semibold text-slate-900">Pengaturan pertanyaan kuisioner</h1>
          <p class="mt-1 text-xs text-slate-500">
            Kelola seluruh daftar pertanyaan yang akan ditampilkan di kuisioner ini.
          </p>
          <p v-if="!notFound && questionnaire" class="mt-2 text-xs text-slate-600">
            Kuisioner:
            <span class="font-semibold text-slate-900">{{ questionnaire.title }}</span>
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-if="!notFound"
            type="button"
            class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            @click="goPreview"
          >
            Review tampilan
          </button>
          <button
            type="button"
            class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            @click="goBack"
          >
            Kembali ke daftar kuisioner
          </button>
        </div>
      </header>

      <div v-if="notFound" class="rounded-3xl bg-white p-5 text-sm text-slate-600 shadow-sm shadow-slate-200/70">
        <p>Kuisioner tidak ditemukan. Silakan kembali ke daftar kuisioner dan pilih kuisioner yang valid.</p>
      </div>

      <div v-else>
        <div
          ref="tabContainerRef"
          class="relative mb-4 inline-flex flex-wrap items-center gap-1 rounded-full bg-slate-100/80 p-1 shadow-sm shadow-slate-200/70"
        >
          <span
            aria-hidden="true"
            class="pointer-events-none absolute left-0 top-0 rounded-full bg-white shadow-sm ring-1 ring-slate-200 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            :style="{
              width: tabIndicator.width + 'px',
              height: tabIndicator.height + 'px',
              transform: `translate(${tabIndicator.left}px, ${tabIndicator.top}px)`,
              opacity: tabIndicator.width ? 0.95 : 0,
              filter: tabIndicator.width ? 'blur(0.4px)' : 'blur(0px)',
            }"
          ></span>
          <button
            type="button"
            :ref="(el) => setTabRef(el, 0)"
            class="relative z-10 rounded-full px-4 py-2 text-xs font-semibold transition-colors duration-200 ease-out"
            :class="activeTabKey === 'detail' ? 'text-slate-900' : 'text-slate-500 hover:bg-white/70 hover:text-slate-900'"
            @click="router.push({ name: 'AdminKuisionerDetail', params: { id: questionnaireId } })"
          >
            Dashboard Jawaban
          </button>
          <button
            type="button"
            :ref="(el) => setTabRef(el, 1)"
            class="relative z-10 rounded-full px-4 py-2 text-xs font-semibold transition-colors duration-200 ease-out"
            :class="activeTabKey === 'questions' ? 'text-slate-900' : 'text-slate-500 hover:bg-white/70 hover:text-slate-900'"
          >
            Manajemen Pertanyaan
          </button>
        </div>

        <div class="rounded-3xl bg-white p-4 shadow-sm shadow-slate-200/70 sm:p-5">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-sm font-semibold text-slate-900">Daftar Pertanyaan</h2>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                @click="openBankSoalPicker"
              >
                Bank Soal
              </button>
              <button
                type="button"
                class="rounded-full bg-slate-900 px-4 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-slate-800"
                @click="openAddQuestion"
              >
                + Tambah Pertanyaan
              </button>
            </div>
          </div>
          <p class="mt-1 text-xs text-slate-500">
            Gunakan navigasi urutan untuk mengatur posisi pertanyaan di formulir.
          </p>

          <p v-if="!extraQuestions.length" class="mt-3 text-xs text-slate-500 font-medium italic">
            Belum ada pertanyaan. Klik tombol di atas untuk menambah.
          </p>

          <div v-else class="mt-4 space-y-3">
            <div
              v-for="(q, index) in extraQuestions"
              :key="q.id"
              class="group relative rounded-2xl border border-slate-100 bg-slate-50/50 p-3 transition-all hover:bg-slate-50 hover:border-indigo-200 sm:p-4"
            >
              <div class="flex items-start gap-3">
                <!-- Urutan Dropdown -->
                <div class="flex flex-col items-center gap-1">
                  <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Urutan</span>
                  <select 
                    :value="index" 
                    class="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition shadow-sm"
                    @change="(e) => moveQuestion(index, parseInt(e.target.value))"
                  >
                    <option v-for="(item, i) in extraQuestions" :key="i" :value="i">
                      {{ i + 1 }}
                    </option>
                  </select>
                </div>

                <div class="flex-1 space-y-3">
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Teks Pertanyaan
                      </label>
                      <div class="flex items-center gap-2">
                        <span v-if="q.questionBankItemId" class="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 italic">
                          Bank Soal
                        </span>
                        <button
                          type="button"
                          class="rounded-full p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Hapus Pertanyaan"
                          @click="askDeleteQuestion(index)"
                        >
                          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <input
                      v-model="q.label"
                      type="text"
                      :disabled="!!q.questionBankItemId"
                      class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-0 transition disabled:bg-slate-100"
                    />
                  </div>

                  <div class="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label class="block mb-1 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Tipe Jawaban</label>
                      <select
                        v-model="q.type"
                        :disabled="!!q.questionBankItemId"
                        class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 transition focus:border-indigo-500 disabled:bg-slate-100"
                      >
                        <option value="text">Teks Singkat</option>
                        <option value="textarea">Teks Panjang</option>
                        <option value="select">Dropdown (Pilihan Tunggal)</option>
                        <option value="multichoice">Checkbox (Pilihan Ganda)</option>
                      </select>
                    </div>
                    <div>
                      <label class="block mb-1 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Target Status</label>
                      <select
                        v-model="q.statusCondition"
                        class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 transition focus:border-indigo-500"
                      >
                        <option
                          v-for="opt in statusChoices"
                          :key="opt.value"
                          :value="opt.value"
                        >
                          {{ opt.label }}
                        </option>
                      </select>
                    </div>
                    <div class="flex items-center gap-2 pt-4">
                      <label class="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
                        <input
                          v-model="q.required"
                          type="checkbox"
                          :disabled="!!q.questionBankItemId"
                          class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Wajib Diisi
                      </label>
                    </div>
                  </div>

                  <div v-if="q.type === 'select' || q.type === 'multichoice'">
                    <label class="block mb-1 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Opsi Jawaban (Pisahkan dengan ;)</label>
                    <input
                      v-model="q.optionsText"
                      type="text"
                      :disabled="!!q.questionBankItemId"
                      class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 focus:border-indigo-500 transition disabled:bg-slate-100"
                      placeholder="Contoh: Sangat Baik; Baik; Cukup"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
            <div class="flex items-center gap-2">
              <span v-if="saving" class="inline-flex items-center gap-2 text-xs font-medium text-slate-400">
                <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Menyimpan...
              </span>
              <span v-else-if="message" class="text-xs font-bold text-emerald-600">{{ message }}</span>
              <span v-else-if="error" class="text-xs font-bold text-rose-600">{{ error }}</span>
            </div>
            <button
              type="button"
              class="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-50"
              :disabled="saving"
              @click="handleSave"
            >
              Simpan Perubahan
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Tambah Pertanyaan -->
    <div
      v-if="showQuestionModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
    >
      <div class="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl shadow-slate-900/20">
        <h2 class="text-sm font-semibold text-slate-900">Tambah Pertanyaan Baru</h2>
        <div class="mt-4 space-y-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Teks Pertanyaan</label>
            <input
              v-model="modalQuestion.label"
              type="text"
              class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Tipe</label>
              <select v-model="modalQuestion.type" class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs">
                <option value="text">Teks Singkat</option>
                <option value="textarea">Teks Panjang</option>
                <option value="select">Dropdown</option>
                <option value="multichoice">Checkbox</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Target</label>
              <select v-model="modalQuestion.statusCondition" class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs">
                <option v-for="opt in statusChoices" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
          </div>
          <div v-if="modalQuestion.type === 'select' || modalQuestion.type === 'multichoice'">
            <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Opsi (Pisahkan dengan ;)</label>
            <input
              v-model="modalQuestion.optionsText"
              type="text"
              class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
            />
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button @click="showQuestionModal = false" class="px-4 py-2 text-xs font-semibold text-slate-600">Batal</button>
          <button @click="confirmAddQuestion" class="rounded-full bg-slate-900 px-6 py-2 text-xs font-bold text-white shadow-md">Simpan</button>
        </div>
      </div>
    </div>

    <!-- Modal Konfirmasi Hapus -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 px-4"
    >
      <div class="w-full max-w-sm rounded-[32px] bg-white p-8 shadow-2xl text-center">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
           <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
           </svg>
        </div>
        <h3 class="text-lg font-bold text-slate-900">Hapus Pertanyaan?</h3>
        <p class="mt-2 text-sm text-slate-500 leading-relaxed">
          Pertanyaan ini akan dihapus dari daftar. Tindakan ini tidak dapat dibatalkan setelah Anda menyimpan perubahan.
        </p>
        <div class="mt-8 flex flex-col gap-2">
          <button 
            @click="confirmDeleteQuestion"
            class="w-full rounded-full bg-rose-600 py-3 text-sm font-bold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-700 active:scale-95"
          >
            Ya, Hapus
          </button>
          <button 
            @click="showDeleteModal = false"
            class="w-full py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition"
          >
            Batalkan
          </button>
        </div>
      </div>
    </div>

    <!-- Bank Soal Modal -->
    <div v-if="showBankSoalModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div class="flex max-h-[78vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white p-5 shadow-xl">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-slate-900">Pilih dari Bank Soal</h2>
          <button @click="showBankSoalModal = false" class="text-slate-400">&times;</button>
        </div>
        <div class="mb-3 space-y-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Cari pertanyaan</label>
            <input
              v-model="bankSearchQuery"
              type="text"
              class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500"
              placeholder="Ketik kata kunci pertanyaan..."
            />
          </div>
          <div class="grid gap-3 sm:grid-cols-3">
            <div>
              <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Target</label>
              <select
                v-model="bankFilterTarget"
                class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500"
              >
                <option v-for="opt in bankTargetOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Status</label>
              <select
                v-model="bankFilterStatus"
                class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500"
              >
                <option v-for="opt in bankStatusOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Tipe</label>
              <select
                v-model="bankFilterType"
                class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500"
              >
                <option v-for="opt in bankTypeOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>
        </div>
        <p v-if="bankSoalError" class="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {{ bankSoalError }}
        </p>
        <div class="custom-scrollbar flex-1 space-y-2 overflow-y-auto pr-2">
          <div v-if="bankSoalLoading" class="p-5 text-center text-xs font-medium text-slate-500 animate-pulse">Memuat bank soal...</div>
          <div v-else-if="!filteredBankSoalQuestions.length" class="p-5 text-center text-xs font-medium text-slate-500">
            Tidak ada pertanyaan yang sesuai filter.
          </div>
          <div
            v-for="item in paginatedBankSoalQuestions"
            :key="item.id"
            class="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
            @click="selectFromBankSoal(item)"
          >
            <div class="flex items-start justify-between">
              <div>
                <p class="mb-1 text-[9px] font-bold uppercase tracking-widest text-indigo-600">{{ getBankQuestionType(item) }}</p>
                <p class="text-sm font-semibold leading-snug text-slate-800">{{ getBankQuestionText(item) }}</p>
              </div>
              <div class="rounded-full bg-slate-100 p-1.5 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div
          v-if="filteredBankSoalQuestions.length"
          class="mt-3 flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            Menampilkan {{ bankShowingRange.start }}-{{ bankShowingRange.end }} dari {{ bankShowingRange.total }} pertanyaan
          </span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="bankCurrentPage === 1"
              @click="bankGoPrev"
            >
              Prev
            </button>
            <span class="font-semibold text-slate-700">Halaman {{ bankCurrentPage }} / {{ bankTotalPages }}</span>
            <button
              type="button"
              class="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="bankCurrentPage === bankTotalPages"
              @click="bankGoNext"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

    <LoadingOverlay :active="pageLoading" />
  </AdminShell>
</template>
