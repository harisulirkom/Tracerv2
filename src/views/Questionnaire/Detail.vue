<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import questionnaireService from '@/services/questionnaireService'

const route = useRoute()
const router = useRouter()

const questionnaire = ref(null)
const questions = ref([])
const loading = ref(false)
const error = ref('')

const fetchData = async () => {
  loading.value = true
  error.value = ''
  try {
    const id = route.params.id
    const detail = await questionnaireService.getById(id)
    const qs = await questionnaireService.getQuestions(id)
    questionnaire.value = detail?.data || detail || null
    questions.value = Array.isArray(qs?.data) ? qs.data : Array.isArray(qs) ? qs : []
  } catch (err) {
    error.value = err?.message || 'Gagal memuat detail kuisioner'
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <main class="mx-auto max-w-5xl space-y-6 py-8">
    <header class="flex items-start justify-between gap-3">
      <div class="space-y-2">
        <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Kuisioner</p>
        <h1 class="text-2xl font-semibold text-slate-900">
          Detail: {{ questionnaire?.title || 'Kuisioner' }}
        </h1>
        <p class="text-sm text-slate-600">{{ questionnaire?.description || 'Tidak ada deskripsi.' }}</p>
        <p class="text-xs font-semibold text-slate-500">
          ID: <span class="font-mono">{{ route.params.id }}</span>
        </p>
      </div>
      <button
        type="button"
        class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        @click="router.push({ name: 'QuestionnaireList' })"
      >
        Kembali
      </button>
    </header>

    <section v-if="error" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {{ error }}
    </section>

    <section
      v-if="loading"
      class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
    >
      Memuat detail...
    </section>

    <section v-else class="space-y-4">
      <h2 class="text-lg font-semibold text-slate-900">Pertanyaan</h2>
      <div class="space-y-3">
        <article
          v-for="q in questions"
          :key="q.id || q.text"
          class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p class="text-sm font-semibold text-slate-900">{{ q.text || q.question || 'Pertanyaan' }}</p>
          <p v-if="q.type" class="text-xs text-slate-500">Tipe: {{ q.type }}</p>
        </article>
        <p v-if="!questions.length" class="text-sm text-slate-600">Belum ada pertanyaan.</p>
      </div>
    </section>
  </main>
</template>
