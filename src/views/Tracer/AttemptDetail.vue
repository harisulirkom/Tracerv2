<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import responseService from '@/services/responseService'

const route = useRoute()
const attemptId = computed(() => route.params.id)
const detail = ref(null)
const loading = ref(false)
const error = ref('')

const fetchDetail = async () => {
  if (!attemptId.value) {
    error.value = 'Attempt ID tidak ditemukan.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const resp = await responseService.getAttemptDetail(attemptId.value)
    detail.value = resp?.data || resp || null
  } catch (err) {
    error.value = err?.message || 'Gagal memuat detail attempt.'
  } finally {
    loading.value = false
  }
}

const formatDate = (val) => {
  if (!val) return '-'
  try {
    return new Date(val).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
  } catch (e) {
    return String(val)
  }
}

const entries = computed(() => {
  const answers = detail.value?.answers || detail.value?.data || detail.value?.responses || {}
  if (Array.isArray(answers)) return answers
  return Object.entries(answers || {}).map(([question, answer]) => ({ question, answer }))
})

onMounted(fetchDetail)
</script>

<template>
  <main class="mx-auto max-w-4xl space-y-6 py-8">
    <header class="space-y-1">
      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Tracer Study</p>
      <h1 class="text-2xl font-semibold text-slate-900">Detail Attempt</h1>
      <p class="text-sm text-slate-600">Attempt ID: {{ attemptId }}</p>
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

    <section v-else class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div class="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span class="rounded-full bg-slate-100 px-3 py-1">
          Attempt {{ detail?.attemptNumber || detail?.attempt_number || attemptId }}
        </span>
        <span class="rounded-full bg-slate-100 px-3 py-1">
          {{ formatDate(detail?.createdAt || detail?.created_at) }}
        </span>
        <span class="rounded-full bg-slate-100 px-3 py-1">
          Alumni: {{ detail?.alumniId || detail?.alumni_id || '-' }}
        </span>
      </div>

      <div class="space-y-3">
        <div
          v-for="(item, idx) in entries"
          :key="item.question || idx"
          class="rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <p class="text-sm font-semibold text-slate-900">{{ item.question || `Pertanyaan ${idx + 1}` }}</p>
          <p class="text-sm text-slate-700">{{ Array.isArray(item.answer) ? item.answer.join(', ') : item.answer }}</p>
        </div>
        <p v-if="!entries.length" class="text-sm text-slate-600">Belum ada jawaban.</p>
      </div>
    </section>
  </main>
</template>
