<script setup>
import { computed, reactive, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuestionnaires } from '../stores/questionnaires'
import AdminShell from '../components/AdminShell.vue'

const route = useRoute()
const router = useRouter()
const {
  questionnaires,
  updateQuestionnaireApi,
  fetchQuestionnaires,
  fetchQuestions,
  questionsById,
  questionsLoading,
  questionsError,
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
  { value: 'bekerja', label: 'Bekerja (full time / part time)' },
  { value: 'wiraswasta', label: 'Wiraswasta' },
  { value: 'melanjutkan_pendidikan', label: 'Melanjutkan pendidikan' },
  { value: 'mencari_kerja', label: 'Tidak bekerja tetapi sedang mencari kerja' },
  { value: 'belum_bekerja', label: 'Belum memungkinkan untuk bekerja' },
]

const extraQuestions = ref(
  questionnaire.value && Array.isArray(questionnaire.value.extraQuestions)
    ? questionnaire.value.extraQuestions.map((q) => ({
        id: q.id,
        label: q.label || '',
        type: q.type || 'text',
        required: !!q.required,
        statusCondition: q.statusCondition || 'all',
        options: Array.isArray(q.options) ? q.options : [],
        optionsText: Array.isArray(q.options) ? q.options.join(' ; ') : '',
      }))
    : [],
)

const showQuestionModal = ref(false)

const modalQuestion = reactive({
  label: '',
  type: 'text',
  optionsText: '',
  required: false,
  statusCondition: 'all',
})

const loadData = async () => {
  saving.value = true
  error.value = ''
  message.value = ''
  try {
    if (!questionnaires.value.length) {
      await fetchQuestionnaires()
    }
    if (questionnaire.value) {
      await fetchQuestions(questionnaireId.value)
      // sinkron extra questions
      extraQuestions.value =
        questionnaire.value && Array.isArray(questionnaire.value.extraQuestions)
          ? questionnaire.value.extraQuestions.map((q) => ({
              id: q.id,
              label: q.label || '',
              type: q.type || 'text',
              required: !!q.required,
              statusCondition: q.statusCondition || 'all',
              options: Array.isArray(q.options) ? q.options : [],
              optionsText: Array.isArray(q.options) ? q.options.join(' ; ') : '',
            }))
          : []
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
  showQuestionModal.value = true
}

const addQuestion = () => {
  openAddQuestion()
}

const questionSections = computed(() => {
  const list = questionsById(questionnaireId.value)
  if (!list.length && questionnaire.value?.questions) return questionnaire.value.questions
  const grouped = new Map()
  list.forEach((q) => {
    const sectionId = q.sectionId || 'lainnya'
    if (!grouped.has(sectionId)) {
      grouped.set(sectionId, { id: sectionId, title: q.sectionTitle || sectionId, fields: [] })
    }
    grouped.get(sectionId).fields.push(q.label || q.question || '')
  })
  return Array.from(grouped.values())
})
const isPengguna = computed(() => questionnaire.value?.audience === 'pengguna')
const removeQuestion = (index) => {
  extraQuestions.value.splice(index, 1)
}

const parseOptions = (raw) =>
  (raw || '')
    .split(';')
    .map((v) => v.trim())
    .filter((v) => v.length > 0)

const handleSave = () => {
  if (!questionnaire.value) return
  saving.value = true
  message.value = ''
  error.value = ''

  try {
    const serialized = extraQuestions.value.map((q) => ({
      id: q.id,
      label: q.label || '',
      type: q.type || 'text',
      required: !!q.required,
      statusCondition: q.statusCondition || 'all',
      options: parseOptions(
        q.optionsText != null && q.optionsText !== ''
          ? q.optionsText
          : Array.isArray(q.options)
            ? q.options.join(';')
            : '',
      ),
    }))

    updateQuestionnaireApi(questionnaire.value.id, {
      extraQuestions: serialized,
    })
    message.value = 'Pertanyaan kuisioner berhasil disimpan.'
  } catch (e) {
    error.value = 'Terjadi kesalahan saat menyimpan pertanyaan kuisioner.'
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  router.push({ name: 'AdminKuisioner' })
}

const goPreview = () => {
  router.push({ name: 'AdminKuisionerPreview', params: { id: questionnaireId.value } })
}

const confirmAddQuestion = () => {
  const newId = Date.now()
  const parsedOptions = parseOptions(modalQuestion.optionsText)

  extraQuestions.value.push({
    id: newId,
    label: modalQuestion.label || '',
    type: modalQuestion.type || 'text',
    required: !!modalQuestion.required,
    statusCondition: modalQuestion.statusCondition || 'all',
    options: parsedOptions,
    optionsText: modalQuestion.optionsText || parsedOptions.join(' ; '),
  })

  showQuestionModal.value = false
}

watch(
  () => questionnaire.value?.extraQuestions,
  (newVal) => {
    if (Array.isArray(newVal)) {
      extraQuestions.value = newVal.map((q) => ({
        id: q.id,
        label: q.label || '',
        type: q.type || 'text',
        required: !!q.required,
        statusCondition: q.statusCondition || 'all',
        options: Array.isArray(q.options) ? q.options : [],
        optionsText: Array.isArray(q.options) ? q.options.join(' ; ') : '',
      }))
    }
  },
)

onMounted(loadData)
</script>

<template>
  <AdminShell>
    <div class="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Kuisioner</p>
          <h1 class="mt-1 text-2xl font-semibold text-slate-900">Pengaturan pertanyaan kuisioner</h1>
          <p class="mt-1 text-xs text-slate-500">
            Kelola pertanyaan tambahan untuk kuisioner tracer ini. Pertanyaan dapat dibatasi berdasarkan status alumni
            atau bersifat umum.
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
            class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 btn-white-gradient-hover"
            @click="goPreview"
          >
            Review tampilan
          </button>
          <button
            type="button"
            class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 btn-white-gradient-hover"
            @click="goBack"
          >
            Kembali ke daftar kuisioner
          </button>
        </div>
      </header>

      <div v-if="notFound" class="rounded-3xl bg-white p-6 text-sm text-slate-600 shadow-sm shadow-slate-200/70">
        <p>Kuisioner tidak ditemukan. Silakan kembali ke daftar kuisioner dan pilih kuisioner yang valid.</p>
      </div>

      <div
        v-else
        class="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200/70"
      >
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-sm font-semibold text-slate-900">Pertanyaan tambahan</h2>
          <button
            type="button"
            class="rounded-full bg-slate-900 px-4 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-slate-800"
            @click="addQuestion"
          >
            + Tambah pertanyaan
          </button>
        </div>
        <p class="mt-1 text-xs text-slate-500">
          Pertanyaan di bawah akan tampil setelah bagian utama kuisioner. Anda dapat memilih tipe jawaban dan untuk
          status alumni mana pertanyaan ditampilkan.
        </p>

        <div class="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-700">
          <div class="flex items-center justify-between gap-2">
            <p class="text-[11px] font-semibold text-slate-600">Pertanyaan dasar kuisioner</p>
            <span
              class="rounded-full px-3 py-1 text-[10px] font-semibold"
              :class="
                isPengguna
                  ? 'bg-emerald-100 text-emerald-700'
                  : questionnaire?.audience === 'umum'
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-indigo-100 text-indigo-700'
              "
            >
              {{ isPengguna ? 'Pengguna alumni' : questionnaire?.audience === 'umum' ? 'Umum' : 'Alumni' }}
            </span>
          </div>
          <p class="mt-1 text-[11px] text-slate-500">
            Pertanyaan ini otomatis muncul di halaman kuisioner publik sesuai tipe kuisioner.
          </p>
          <p v-if="questionsError" class="mt-2 text-[11px] font-semibold text-rose-600">
            {{ questionsError }}
          </p>
          <div v-else-if="questionsLoading" class="mt-3 rounded-xl bg-white px-3 py-2 text-[11px] text-slate-500">
            Memuat pertanyaan...
          </div>
          <div v-else class="mt-3 grid gap-2 sm:grid-cols-2">
            <div
              v-for="section in questionSections"
              :key="section.id"
              class="rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-sm"
            >
              <p class="text-[11px] font-semibold text-slate-700">{{ section.title }}</p>
              <ul class="mt-1 list-disc space-y-1 pl-4 text-[11px] text-slate-600">
                <li v-for="(field, idx) in section.fields || []" :key="`${section.id}-${idx}`">
                  {{ field }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <p v-if="!extraQuestions.length" class="mt-4 text-xs text-slate-500">
          Belum ada pertanyaan tambahan. Klik tombol "Tambah pertanyaan" untuk mulai menambahkan.
        </p>

        <div v-else class="mt-4 space-y-4 text-xs text-slate-700">
          <div
            v-for="(q, index) in extraQuestions"
            :key="q.id || index"
            class="rounded-2xl border border-slate-100 bg-slate-50 p-4"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 space-y-3">
                <div>
                  <label class="block text-[11px] font-semibold text-slate-600">Teks pertanyaan</label>
                  <input
                    v-model="q.label"
                    type="text"
                    class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none ring-0 transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    placeholder="Contoh: Seberapa relevan kurikulum dengan pekerjaan Anda?"
                  />
                </div>

                <div class="grid gap-2 sm:grid-cols-3">
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-600">Tipe jawaban</label>
                    <select
                      v-model="q.type"
                      class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-900 outline-none ring-0 transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    >
                      <option value="text">Teks singkat</option>
                      <option value="textarea">Text area</option>
                      <option value="select">Dropdown</option>
                      <option value="multichoice">Multiple choice</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-600">Tampilkan untuk status</label>
                    <select
                      v-model="q.statusCondition"
                      class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-900 outline-none ring-0 transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
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
                  <div class="flex items-center gap-2 pt-5 sm:pt-6">
                    <label class="inline-flex cursor-pointer items-center gap-2 text-[11px] text-slate-600">
                      <input
                        v-model="q.required"
                        type="checkbox"
                        class="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      Wajib diisi
                    </label>
                  </div>
                </div>

                <div v-if="q.type === 'select' || q.type === 'multichoice'">
                  <label class="block text-[11px] font-semibold text-slate-600">Opsi jawaban</label>
                  <input
                    v-model="q.optionsText"
                    type="text"
                    class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none ring-0 transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    placeholder="Pisahkan opsi dengan tanda ;  contoh: Sangat setuju; Setuju; Netral; Tidak setuju"
                  />
                </div>
              </div>

              <button
                type="button"
                class="mt-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100"
                @click="removeQuestion(index)"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>

        <div class="mt-5 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 btn-white-gradient-hover"
              @click="addQuestion"
            >
              + Tambah pertanyaan
            </button>
          </div>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            :disabled="saving"
            @click="handleSave"
          >
            {{ saving ? 'Menyimpan...' : 'Simpan pertanyaan' }}
          </button>
        </div>

        <p v-if="message" class="mt-2 text-xs font-semibold text-emerald-600">
          {{ message }}
        </p>
        <p v-if="error" class="mt-2 text-xs font-semibold text-rose-600">
          {{ error }}
        </p>
      </div>
    </div>

  <div
    v-if="showQuestionModal"
    class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4"
    >
    <div class="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/20">
      <h2 class="text-sm font-semibold text-slate-900">Tambah pertanyaan baru</h2>
      <p class="mt-1 text-xs text-slate-500">
        Pertanyaan ini akan muncul sebagai pertanyaan tambahan di kuisioner sesuai status yang Anda pilih.
      </p>

      <div class="mt-4 space-y-3 text-xs text-slate-700">
        <div>
          <label class="block text-[11px] font-semibold text-slate-600">Teks pertanyaan</label>
          <input
            v-model="modalQuestion.label"
            type="text"
            class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none ring-0 transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            placeholder="Contoh: Seberapa relevan kurikulum dengan pekerjaan Anda?"
          />
        </div>

        <div class="grid gap-2 sm:grid-cols-3">
          <div>
            <label class="block text-[11px] font-semibold text-slate-600">Tipe jawaban</label>
            <select
              v-model="modalQuestion.type"
              class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-900 outline-none ring-0 transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            >
              <option value="text">Teks singkat</option>
              <option value="textarea">Text area</option>
              <option value="select">Dropdown</option>
              <option value="multichoice">Multiple choice</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-600">Tampilkan untuk status</label>
            <select
              v-model="modalQuestion.statusCondition"
              class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-900 outline-none ring-0 transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
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
          <div class="flex items-center gap-2 pt-5 sm:pt-6">
            <label class="inline-flex cursor-pointer items-center gap-2 text-[11px] text-slate-600">
              <input
                v-model="modalQuestion.required"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              Wajib diisi
            </label>
          </div>
        </div>

        <div v-if="modalQuestion.type === 'select' || modalQuestion.type === 'multichoice'">
          <label class="block text-[11px] font-semibold text-slate-600">Opsi jawaban</label>
          <input
            v-model="modalQuestion.optionsText"
            type="text"
            class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none ring-0 transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            placeholder="Pisahkan opsi dengan tanda ;  contoh: Sangat setuju; Setuju; Netral; Tidak setuju"
          />
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          @click="showQuestionModal = false"
        >
          Batal
        </button>
        <button
          type="button"
          class="rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
          @click="confirmAddQuestion"
        >
          Tambah
        </button>
      </div>
    </div>
  </div>
  </AdminShell>
</template>
