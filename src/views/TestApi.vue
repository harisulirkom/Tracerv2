<script setup>
import { onMounted, ref } from 'vue'
import { get } from '@/services/api'

const status = ref('loading')
const message = ref('Menguji koneksi API...')

const pingApi = async () => {
  status.value = 'loading'
  message.value = 'Menguji koneksi API...'
  try {
    const data = await get('/ping')
    status.value = 'ok'
    message.value = data?.message || 'API OK'
  } catch (err) {
    status.value = 'error'
    const apiMessage =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      'Gagal terhubung ke API'
    message.value = apiMessage
  }
}

onMounted(pingApi)
</script>

<template>
  <main class="mx-auto max-w-xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <header class="space-y-1">
      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">API Test</p>
      <h1 class="text-2xl font-semibold text-slate-900">Koneksi Laravel API</h1>
      <p class="text-sm text-slate-600">Endpoint: <code>/api/ping</code></p>
    </header>

    <div
      class="rounded-xl border px-4 py-3 text-sm font-semibold"
      :class="{
        'border-emerald-200 bg-emerald-50 text-emerald-800': status === 'ok',
        'border-slate-200 bg-slate-50 text-slate-700': status === 'loading',
        'border-rose-200 bg-rose-50 text-rose-700': status === 'error',
      }"
    >
      <span v-if="status === 'ok'">API OK — {{ message }}</span>
      <span v-else-if="status === 'loading'">Memeriksa koneksi... {{ message }}</span>
      <span v-else>Gagal: {{ message }}</span>
    </div>

    <div class="flex items-center gap-3">
      <button
        type="button"
        class="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="status === 'loading'"
        @click="pingApi"
      >
        {{ status === 'loading' ? 'Memeriksa...' : 'Cek Lagi' }}
      </button>
      <p class="text-xs text-slate-500">Pastikan backend Laravel berjalan di 127.0.0.1:8000.</p>
    </div>
  </main>
</template>
