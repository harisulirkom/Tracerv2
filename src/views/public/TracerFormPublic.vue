<template>
  <div class="max-w-5xl p-6 mx-auto space-y-5">
    <header class="space-y-1">
      <p class="text-sm text-indigo-700 font-semibold">Tracer Study</p>
      <h1 class="text-2xl font-bold text-gray-900">
        {{ questionnaire?.title || 'Kuisioner Alumni' }}
      </h1>
      <p class="text-gray-600">{{ questionnaire?.description }}</p>
    </header>

    <section v-if="error" class="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
      {{ error }}
    </section>
    <section
      v-if="successMessage"
      class="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded"
    >
      {{ successMessage }}
    </section>

    <section class="flex items-center gap-3 text-sm text-gray-600">
      <button class="px-3 py-2 text-sm text-gray-700 border rounded" @click="loadData" :disabled="loading">
        {{ loading ? 'Memuat...' : 'Refresh' }}
      </button>
      <span v-if="questionnaire?.estimatedTime">Estimasi waktu: {{ questionnaire.estimatedTime }}</span>
      <span class="px-2 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full">
        Audience: Alumni
      </span>
    </section>

    <section v-if="loading" class="p-6 text-center text-gray-500 border rounded bg-white">
      Memuat daftar pertanyaan...
    </section>

    <section v-else class="space-y-6">
      <div
        v-for="section in questionSections"
        :key="section.id"
        class="p-5 bg-white border rounded space-y-3"
      >
        <header class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-wide text-gray-500">{{ section.id }}</p>
            <h2 class="text-lg font-semibold text-gray-900">{{ section.title }}</h2>
          </div>
          <button
            v-if="section.canReset"
            class="text-sm text-gray-500 hover:underline"
            @click="handleDelete(section)"
          >
            Hapus jawaban bagian ini
          </button>
        </header>
        <div class="space-y-3">
          <div v-for="question in section.questions" :key="question.id" class="space-y-1">
            <label class="flex items-center gap-2 text-sm font-medium text-gray-800">
              <span>{{ question.label }}</span>
              <span v-if="question.required" class="text-red-500">*</span>
            </label>
            <template v-if="question.type === 'select'">
              <select
                v-model="answers[question.id]"
                class="w-full px-3 py-2 border rounded"
                @change="handleUpdate(question)"
              >
                <option value="">Pilih salah satu</option>
                <option v-for="opt in question.options" :key="opt" :value="opt">
                  {{ opt }}
                </option>
              </select>
            </template>
            <template v-else-if="question.type === 'radio'">
              <div class="flex flex-wrap gap-3">
                <label
                  v-for="opt in question.options"
                  :key="opt"
                  class="inline-flex items-center gap-2 text-sm text-gray-700"
                >
                  <input
                    v-model="answers[question.id]"
                    type="radio"
                    :name="`q-${question.id}`"
                    :value="opt"
                    @change="handleUpdate(question)"
                  />
                  <span>{{ opt }}</span>
                </label>
              </div>
            </template>
            <template v-else-if="question.type === 'textarea'">
              <textarea
                v-model="answers[question.id]"
                class="w-full px-3 py-2 border rounded"
                rows="3"
                @input="handleUpdate(question)"
              />
            </template>
            <template v-else>
              <input
                v-model="answers[question.id]"
                class="w-full px-3 py-2 border rounded"
                type="text"
                @input="handleUpdate(question)"
              />
            </template>
            <p v-if="question.helper" class="text-xs text-gray-500">{{ question.helper }}</p>
          </div>
        </div>
      </div>

      <div class="p-5 bg-white border rounded space-y-3">
        <header class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">Pertanyaan tambahan</h2>
          <button class="text-sm text-indigo-600 hover:underline" @click="addEmptyExtra">
            Tambah baris
          </button>
        </header>
        <div v-if="!extraQuestions.length" class="text-sm text-gray-500">
          Belum ada pertanyaan tambahan yang Anda isi.
        </div>
        <div v-for="(q, idx) in extraQuestions" :key="q.localId" class="grid gap-2 md:grid-cols-2">
          <input
            v-model="q.label"
            class="px-3 py-2 border rounded"
            placeholder="Pertanyaan tambahan"
            @input="handleUpdate(q)"
          />
          <div class="flex gap-2">
            <input
              v-model="q.answer"
              class="flex-1 px-3 py-2 border rounded"
              placeholder="Jawaban Anda"
              @input="handleUpdate(q)"
            />
            <button class="px-3 py-2 text-sm text-red-600 border rounded" @click="handleDelete(q)">
              Hapus
            </button>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button
          class="px-5 py-3 text-white bg-indigo-600 rounded"
          :disabled="saving"
          @click="handleSubmit"
        >
          {{ saving ? 'Mengirim...' : 'Kirim jawaban' }}
        </button>
        <button class="px-4 py-2 text-gray-700 border rounded" @click="loadDraft">Muat draft terakhir</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import tracerService from '@/services/tracerService'

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const successMessage = ref('')
const questionnaire = ref(null)
const questions = ref([])
const answers = reactive({})
const extraQuestions = ref([])

const questionSections = computed(() => {
  const grouped = new Map()
  questions.value.forEach((q) => {
    const sectionId = q.sectionId || 'lainnya'
    if (!grouped.has(sectionId)) {
      grouped.set(sectionId, { id: sectionId, title: q.sectionTitle || sectionId, questions: [] })
    }
    grouped.get(sectionId).questions.push(q)
  })
  return Array.from(grouped.values()).map((section) => ({
    ...section,
    canReset: section.questions.length > 0,
  }))
})

const normalizeQuestions = (payload) => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (payload.data && Array.isArray(payload.data)) return payload.data
  if (payload.items && Array.isArray(payload.items)) return payload.items
  return []
}

const loadData = async () => {
  loading.value = true
  error.value = ''
  try {
    const active = await tracerService.getActiveQuestionnaire('alumni')
    questionnaire.value = active?.data || active
    if (questionnaire.value?.id) {
      const result = await tracerService.getQuestions(questionnaire.value.id)
      questions.value = normalizeQuestions(result)
    } else {
      questions.value = []
    }
  } catch (err) {
    error.value = err.message || 'Gagal memuat kuisioner'
  } finally {
    loading.value = false
  }
}

const addEmptyExtra = () => {
  extraQuestions.value.push({
    localId: crypto.randomUUID ? crypto.randomUUID() : Date.now(),
    label: '',
    answer: '',
  })
}

const handleUpdate = (question) => {
  // Reactive answers sudah diikat via v-model, fungsi ini hanya menjaga state tambahan
  if (question.localId) {
    // eslint-disable-next-line no-param-reassign
    question.updatedAt = new Date().toISOString()
  }
}

const handleDelete = (target) => {
  if (target.localId) {
    extraQuestions.value = extraQuestions.value.filter((item) => item.localId !== target.localId)
  } else if (target.id) {
    delete answers[target.id]
  }
}

const serializePayload = () => {
  const baseAnswers = {}
  Object.entries(answers).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      baseAnswers[key] = value
    }
  })

  const extras = extraQuestions.value
    .filter((item) => item.label && item.answer)
    .map((item) => ({ label: item.label, answer: item.answer }))

  return {
    questionnaireId: questionnaire.value?.id,
    audience: 'alumni',
    answers: baseAnswers,
    extra: extras,
  }
}

const handleSubmit = async () => {
  if (!questionnaire.value?.id) {
    error.value = 'Kuisioner tidak ditemukan'
    return
  }
  saving.value = true
  successMessage.value = ''
  error.value = ''
  try {
    const payload = serializePayload()
    await tracerService.submitAlumniAnswer(payload)
    successMessage.value = 'Jawaban berhasil dikirim. Terima kasih!'
  } catch (err) {
    error.value = err.message || 'Gagal mengirim jawaban'
  } finally {
    saving.value = false
  }
}

const loadDraft = () => {
  // Contoh placeholder draft; bisa dihubungkan ke endpoint /tracer/submissions/:id
  const draft = localStorage.getItem('tracer_draft_alumni')
  if (!draft) return
  try {
    const parsed = JSON.parse(draft)
    Object.keys(answers).forEach((key) => delete answers[key])
    Object.entries(parsed.answers || {}).forEach(([key, value]) => {
      answers[key] = value
    })
    extraQuestions.value = Array.isArray(parsed.extra)
      ? parsed.extra.map((item) => ({ ...item, localId: crypto.randomUUID ? crypto.randomUUID() : Date.now() }))
      : []
    successMessage.value = 'Draft dimuat'
  } catch (err) {
    // ignore parse error
  }
}

onMounted(loadData)
</script>
