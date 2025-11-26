<script setup>
import { computed, ref, onMounted } from 'vue'
import { useArticles } from '../stores/articles'

const { articles, fetchArticles, loading, error } = useArticles()
const filterStatus = ref('all')
const searchQuery = ref('')
const articleModalOpen = ref(false)
const selectedArticle = ref(null)

const filteredArticles = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return articles.value.filter((item) => {
    if (filterStatus.value === 'published' && !item.published) return false
    if (filterStatus.value === 'draft' && item.published) return false
    if (!q) return true
    const haystack = `${item.title || ''} ${item.summary || ''} ${item.content || ''}`.toLowerCase()
    return haystack.includes(q)
  })
})

const openArticle = (item) => {
  selectedArticle.value = item
  articleModalOpen.value = true
}

const closeArticleModal = () => {
  articleModalOpen.value = false
  selectedArticle.value = null
}

onMounted(() => {
  fetchArticles()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Artikel & Tips Karier</p>
        <h1 class="text-3xl font-semibold text-slate-900">Semua artikel & konten</h1>
        <p class="text-sm text-slate-600">Kumpulan panduan singkat untuk persiapan karier, lowongan, dan tips profesional.</p>
      </div>
      <div class="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-600">
        <div class="inline-flex rounded-full bg-slate-50 p-1">
          <button
            type="button"
            class="rounded-full px-3 py-1"
            :class="filterStatus === 'all' ? 'bg-slate-900 text-white' : 'hover:text-slate-900'"
            @click="filterStatus = 'all'"
          >
            Semua
          </button>
          <button
            type="button"
            class="rounded-full px-3 py-1"
            :class="filterStatus === 'published' ? 'bg-emerald-600 text-white' : 'hover:text-slate-900'"
            @click="filterStatus = 'published'"
          >
            Publish
          </button>
          <button
            type="button"
            class="rounded-full px-3 py-1"
            :class="filterStatus === 'draft' ? 'bg-slate-700 text-white' : 'hover:text-slate-900'"
            @click="filterStatus = 'draft'"
          >
            Draft
          </button>
        </div>
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            class="w-48 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 pr-7 text-xs text-slate-700 outline-none ring-0 transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            placeholder="Cari artikel..."
          />
          <span class="pointer-events-none absolute right-2 top-1.5 text-[11px] text-slate-400">⌕</span>
        </div>
      </div>
    </div>

    <div v-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">
      {{ error }}
    </div>
    <div v-else-if="loading" class="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
      Memuat artikel...
    </div>
    <div v-else-if="!filteredArticles.length" class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
      Belum ada artikel tersedia.
    </div>

    <div v-else class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="item in filteredArticles"
        :key="item.id"
        class="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
      >
        <div v-if="item.imageUrl" class="relative h-36 w-full overflow-hidden">
          <img
            :src="item.imageUrl"
            :alt="item.title"
            class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent" />
        </div>
        <div class="space-y-2 p-4">
          <div class="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
            <span
              class="rounded-full px-3 py-1"
              :class="item.published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'"
            >
              {{ item.published ? 'Publish' : 'Draft' }}
            </span>
            <span>{{ new Date(item.createdAt).toLocaleDateString('id-ID') }}</span>
          </div>
          <h3 class="text-lg font-semibold text-slate-900 group-hover:text-indigo-600">{{ item.title }}</h3>
          <p class="text-sm text-slate-600 line-clamp-3">{{ item.summary }}</p>
          <button
            type="button"
            class="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
            @click="openArticle(item)"
          >
            Lihat rincian
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </article>
    </div>

    <div
      v-if="articleModalOpen && selectedArticle"
      class="fixed inset-0 z-40 flex items-start justify-center bg-slate-900/50 p-4 sm:items-center"
      @click.self="closeArticleModal"
    >
      <div class="relative w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8" style="max-height: 90vh">
        <button
          type="button"
          class="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          @click="closeArticleModal"
        >
          ✕
        </button>
        <div class="space-y-3">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">Artikel & Tips</p>
          <h3 class="text-2xl font-semibold text-slate-900">{{ selectedArticle.title }}</h3>
          <p class="text-sm font-semibold text-slate-800">{{ selectedArticle.summary }}</p>
          <div v-if="selectedArticle.imageUrl" class="overflow-hidden rounded-2xl border border-slate-100">
            <img :src="selectedArticle.imageUrl" :alt="selectedArticle.title" class="h-64 w-full object-cover" loading="lazy" />
          </div>
          <div class="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
            {{ selectedArticle.content || 'Tidak ada konten tambahan.' }}
          </div>
          <div class="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              @click="closeArticleModal"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
