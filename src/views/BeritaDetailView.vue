<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNews } from '../stores/news'

const route = useRoute()
const router = useRouter()
const { news, fetchNews, loading, error } = useNews()
const loadingDetail = ref(false)

const berita = computed(() => {
  const idParam = route.params.id
  const idNum = Number(idParam)
  const match =
    news.value.find((item) => String(item.id) === String(idParam) || item.id === idNum) || null
  return match || null
})

const formattedDate = computed(() => {
  if (!berita.value) return ''
  return new Date(berita.value.createdAt).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
})

const goBack = () => {
  router.push({ name: 'Berita' })
}

onMounted(async () => {
  if (!news.value.length) {
    await fetchNews()
  }
  if (!berita.value && route.params.id) {
    loadingDetail.value = true
    try {
      await fetchNews({ id: route.params.id })
    } catch (e) {
      // ignore
    } finally {
      loadingDetail.value = false
    }
  }
})
</script>

<template>
  <div class="space-y-8">
    <header class="space-y-3">
      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Berita</p>
      <h1 class="text-3xl font-semibold text-slate-900">Detail berita tracer study</h1>
      <p class="text-slate-600">Baca informasi lengkap terkait tracer study dan aktivitas kampus.</p>
    </header>

    <div v-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700">
      {{ error }}
    </div>
    <div
      v-else-if="loading || loadingDetail"
      class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600"
    >
      Memuat detail berita...
    </div>
    <div v-else-if="!berita" class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
      <p>Berita tidak ditemukan atau sudah dihapus.</p>
      <button
        type="button"
        class="mt-4 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        @click="goBack"
      >
        Kembali ke daftar berita
      </button>
    </div>

    <article v-else class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
      <div v-if="berita.imageUrl" class="h-56 w-full overflow-hidden bg-slate-100 sm:h-64">
        <img :src="berita.imageUrl" :alt="berita.title" class="h-full w-full object-cover" />
      </div>

      <div class="space-y-4 px-6 py-6 sm:px-8 sm:py-8">
        <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span class="rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-700">
            {{ formattedDate }}
          </span>
          <span
            class="rounded-full px-3 py-1 font-semibold"
            :class="berita.published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'"
          >
            {{ berita.published ? 'Dipublikasikan' : 'Draft' }}
          </span>
        </div>

        <h2 class="text-2xl font-semibold text-slate-900 sm:text-3xl">
          {{ berita.title }}
        </h2>

        <p v-if="berita.summary" class="text-sm text-slate-600">
          {{ berita.summary }}
        </p>

        <div class="pt-2 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
          {{ berita.content }}
        </div>

        <div class="pt-4">
          <button
            type="button"
            class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            @click="goBack"
          >
            Kembali ke daftar berita
          </button>
        </div>
      </div>
    </article>
  </div>
</template>
