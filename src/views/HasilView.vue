<script setup>
const stats = [
  { value: '18K+', label: 'Respon alumni terkumpul' },
  { value: '92%', label: 'Kepuasan tracer team' },
  { value: '3x', label: 'Lebih cepat publikasi laporan' },
  { value: '40%', label: 'Penghematan waktu entri data' },
]

const insights = [
  'Persebaran pekerjaan alumni per wilayah dan sektor industri.',
  'Waktu tunggu mendapatkan pekerjaan pertama.',
  'Kesesuaian bidang studi dengan pekerjaan alumni.',
  'Top skills yang paling dibutuhkan pemberi kerja.',
]
</script>

<template>
  <div class="space-y-10">
    <header class="space-y-3">
      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Hasil</p>
      <h1 class="text-3xl font-semibold text-slate-900">Ringkasan hasil tracer</h1>
      <p class="text-slate-600">Sorotan kinerja pengisian tracer study terbaru.</p>
    </header>

    <div class="grid gap-6 sm:grid-cols-4">
      <div v-for="item in stats" :key="item.label" class="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
        <p class="text-2xl font-semibold text-slate-900">{{ item.value }}</p>
        <p class="mt-2 text-sm text-slate-600">{{ item.label }}</p>
      </div>
    </div>

    <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 class="text-2xl font-semibold text-slate-900">Insight utama</h2>
      <ul class="mt-4 space-y-3 text-sm text-slate-600">
        <li v-for="point in insights" :key="point" class="flex gap-2">
          <span class="mt-1 h-2 w-2 rounded-full bg-indigo-400"></span>
          <span>{{ point }}</span>
        </li>
      </ul>
      <div class="mt-6 flex flex-wrap gap-3 text-xs text-slate-600">
        <span class="rounded-full bg-slate-100 px-3 py-1">Eksport PDF/Excel</span>
        <span class="rounded-full bg-slate-100 px-3 py-1">Filter cohort</span>
        <span class="rounded-full bg-slate-100 px-3 py-1">Share ke pimpinan</span>
      </div>
    </div>
  </div>
</template>
