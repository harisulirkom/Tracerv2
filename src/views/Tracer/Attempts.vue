<script setup>
import { reactive, ref } from 'vue'
import responseService from '@/services/responseService'

const attempts = ref([])
const loading = ref(false)
const error = ref('')
const form = reactive({
  alumni_id: '',
})

const fetchAttempts = async () => {
  error.value = ''
  attempts.value = []
  if (!form.alumni_id) {
    error.value = 'Isi Alumni ID terlebih dahulu.'
    return
  }
  loading.value = true
  try {
    const resp = await responseService.getAttempts(form.alumni_id)
    attempts.value = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : []
  } catch (err) {
    error.value = err?.message || 'Gagal memuat riwayat attempt.'
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
</script>

<template>
  <main class="mx-auto max-w-3xl space-y-6 py-8">
    <header class="space-y-1">
      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Tracer Study</p>
      <h1 class="text-2xl font-semibold text-slate-900">Riwayat Attempt Kuisioner Alumni</h1>
      <p class="text-sm text-slate-600">Masukkan Alumni ID/NIM, lalu lihat riwayat attempt.</p>
    </header>

    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
      <label class="block space-y-1">
        <span class="text-sm font-semibold text-slate-800">Alumni ID / NIM</span>
        <input
          v-model="form.alumni_id"
          type="text"
          class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          placeholder="Contoh: 190102001"
        />
      </label>
      <button
        type="button"
        class="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="loading"
        @click="fetchAttempts"
      >
        {{ loading ? 'Memuat...' : 'Lihat Attempt' }}
      </button>
      <p v-if="error" class="text-xs font-semibold text-rose-600">{{ error }}</p>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
      <p class="text-sm font-semibold text-slate-900">Daftar Attempt</p>
      <div v-if="loading" class="text-sm text-slate-600">Memuat riwayat...</div>
      <div v-else-if="!attempts.length" class="text-sm text-slate-600">Belum ada attempt.</div>
      <ul v-else class="space-y-2">
        <li
          v-for="(item, idx) in attempts"
          :key="item.id || idx"
          class="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
        >
          <div class="space-y-0.5">
            <p class="font-semibold text-slate-900">Attempt {{ item.attemptNumber || idx + 1 }}</p>
            <p class="text-xs text-slate-600">Tanggal: {{ formatDate(item.createdAt || item.created_at) }}</p>
          </div>
          <router-link
            class="text-indigo-600 text-sm font-semibold hover:underline"
            :to="{ name: 'TracerAttemptDetail', params: { id: item.id || item.attemptId || item.attempt_id } }"
          >
            Detail
          </router-link>
        </li>
      </ul>
    </section>
  </main>
</template>
