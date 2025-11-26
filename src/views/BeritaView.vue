<script setup>
import { computed, onMounted } from 'vue'
import { useNews } from '../stores/news'

const { news, fetchNews, loading, error } = useNews()

const fallbackBerita = [
  {
    title: 'Kuisioner tracer 2025 dibuka',
    date: '10 Jan 2025',
    summary: 'Periode pengisian tracer study 2025 resmi dimulai, target respon minimal 70%.',
  },
  {
    title: 'Rilis dashboard karier',
    date: '05 Jan 2025',
    summary: 'Dashboard baru menampilkan peta persebaran alumni dan ringkasan pekerjaan populer.',
  },
  {
    title: 'Integrasi ke sistem akademik',
    date: '18 Des 2024',
    summary: 'Data tracer kini terhubung ke SIAKAD untuk sinkronisasi data lulusan dan prodi.',
  },
  {
    title: 'Pelatihan admin tracer',
    date: '08 Des 2024',
    summary: 'Workshop untuk admin baru mencakup pembuatan kuisioner dan ekspor laporan.',
  },
]

const beritaList = computed(() => {
  const dynamic = news.value
    .filter((item) => item.published)
    .map((item) => ({
      id: item.id,
      title: item.title,
      date: new Date(item.createdAt).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      summary:
        item.summary ||
        (item.content && item.content.length > 160
          ? `${item.content.slice(0, 157)}...`
          : item.content || ''),
    }))

  if (dynamic.length) return dynamic
  return fallbackBerita
})

onMounted(() => {
  fetchNews()
})
</script>

<template>
  <div class="space-y-8">
    <header class="space-y-3">
      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Berita</p>
      <h1 class="text-3xl font-semibold text-slate-900">Kabar terbaru tracer study</h1>
      <p class="text-slate-600">Ikuti pengumuman resmi, fitur baru, dan jadwal penting tracer.</p>
    </header>

    <div class="grid gap-5 md:grid-cols-2">
      <p v-if="error" class="text-sm font-semibold text-rose-600">{{ error }}</p>
      <p v-else-if="loading" class="text-sm text-slate-500">Memuat berita...</p>
      <p v-else-if="!beritaList.length" class="text-sm text-slate-500">Belum ada berita.</p>
      <article
        v-for="berita in beritaList"
        :key="berita.id || berita.title"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
      >
        <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{{ berita.date }}</p>
        <h3 class="mt-2 text-xl font-semibold text-slate-900">{{ berita.title }}</h3>
        <p class="mt-3 text-sm text-slate-600">{{ berita.summary }}</p>
        <RouterLink
          v-if="berita.id"
          :to="`/berita/${berita.id}`"
          class="mt-5 inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-500"
        >
          Baca selengkapnya ->
        </RouterLink>
        <button
          v-else
          class="mt-5 cursor-default text-sm font-semibold text-slate-400"
          type="button"
        >
          Baca selengkapnya ->
        </button>
      </article>
    </div>
  </div>
</template>
