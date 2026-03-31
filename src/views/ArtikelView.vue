<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useArticles } from '../stores/articles'
import { useLocalizedDynamicContent } from '../composables/useLocalizedDynamicContent'

const { articles, fetchArticles, loading, error } = useArticles()
const { locale } = useI18n()
const {
  toText,
  resolveLocalizedString,
  resolveSummary,
  resolvePublishedStatus,
  resolveDateValue,
} = useLocalizedDynamicContent(locale)

const searchQuery = ref('')
const articleModalOpen = ref(false)
const selectedArticleId = ref(null)

const copyByLocale = {
  id: {
    tag: 'Artikel & Tips Karier',
    title: 'Semua artikel & konten',
    desc: 'Kumpulan panduan singkat untuk persiapan karier, lowongan, dan tips profesional.',
    searchPlaceholder: 'Cari artikel...',
    loading: 'Memuat artikel...',
    empty: 'Belum ada artikel tersedia.',
    viewDetail: 'Lihat rincian',
    close: 'Tutup',
    noExtra: 'Tidak ada konten tambahan.',
    publish: 'Publish',
    draft: 'Draft',
  },
  en: {
    tag: 'Career Articles & Tips',
    title: 'All articles & content',
    desc: 'A collection of quick guides for career preparation, vacancies, and professional tips.',
    searchPlaceholder: 'Search articles...',
    loading: 'Loading articles...',
    empty: 'No articles available yet.',
    viewDetail: 'View details',
    close: 'Close',
    noExtra: 'No additional content.',
    publish: 'Published',
    draft: 'Draft',
  },
  ar: {
    tag: 'مقالات ونصائح مهنية',
    title: 'جميع المقالات والمحتوى',
    desc: 'مجموعة أدلة مختصرة للتحضير المهني والوظائف والنصائح الاحترافية.',
    searchPlaceholder: 'ابحث في المقالات...',
    loading: 'جار تحميل المقالات...',
    empty: 'لا توجد مقالات متاحة حاليا.',
    viewDetail: 'عرض التفاصيل',
    close: 'إغلاق',
    noExtra: 'لا يوجد محتوى إضافي.',
    publish: 'منشور',
    draft: 'مسودة',
  },
}

const ui = computed(() => copyByLocale[locale.value] || copyByLocale.id)
const localeCode = computed(() => (locale.value === 'ar' ? 'ar-SA' : locale.value === 'en' ? 'en-US' : 'id-ID'))

const localizedArticles = computed(() =>
  articles.value.map((item, index) => ({
    ...item,
    id: item?.id ?? `article-${index}`,
    title: resolveLocalizedString(item, 'title') || 'Untitled article',
    summary: resolveSummary(item, ui.value.noExtra),
    content: resolveLocalizedString(item, 'content'),
    imageUrl: toText(item?.imageUrl || item?.image_url),
    createdAt: resolveDateValue(item),
    published: resolvePublishedStatus(item?.published),
  })),
)

const filteredArticles = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return localizedArticles.value.filter((item) => {
    if (!item.published) return false
    if (!q) return true
    const haystack = `${item.title || ''} ${item.summary || ''} ${item.content || ''}`.toLowerCase()
    return haystack.includes(q)
  })
})

const openArticle = (item) => {
  selectedArticleId.value = item?.id ?? null
  articleModalOpen.value = true
}

const closeArticleModal = () => {
  articleModalOpen.value = false
  selectedArticleId.value = null
}

const selectedArticle = computed(() => {
  if (selectedArticleId.value === null || selectedArticleId.value === undefined) return null
  return (
    localizedArticles.value.find((item) => String(item?.id) === String(selectedArticleId.value)) || null
  )
})

onMounted(() => {
  fetchArticles()
})
</script>

<template>
  <div class="public-page">
    <section class="public-hero-panel motion-card-sheen p-6 sm:p-7">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="public-kicker">{{ ui.tag }}</p>
        <h1 class="public-section-title mt-3">{{ ui.title }}</h1>
        <p class="public-section-subtitle">{{ ui.desc }}</p>
      </div>
      <div class="flex flex-wrap items-center justify-start gap-2 text-[11px] font-semibold text-slate-600 sm:justify-end">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            class="w-48 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 pr-7 text-xs text-slate-700 outline-none ring-0 transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            :placeholder="ui.searchPlaceholder"
          />
          <svg
            class="pointer-events-none absolute right-2 top-1.5 h-3.5 w-3.5 text-slate-400"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m14 14-3.5-3.5m0 0A4.5 4.5 0 1 0 14.5 6 4.5 4.5 0 0 0 10.5 10.5Z"
            />
          </svg>
        </div>
      </div>
      </div>
    </section>

    <div v-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">
      {{ error }}
    </div>
    <div v-else-if="loading" class="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
      {{ ui.loading }}
    </div>
    <div v-else-if="!filteredArticles.length" class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
      {{ ui.empty }}
    </div>

    <div v-else class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="(item, itemIdx) in filteredArticles"
        :key="item.id"
        class="public-news-card motion-card-sheen motion-delay-item group"
        :style="{ '--stagger-index': itemIdx }"
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
              {{ item.published ? ui.publish : ui.draft }}
            </span>
            <span>{{ new Date(item.createdAt).toLocaleDateString(localeCode) }}</span>
          </div>
          <h3 class="text-lg font-semibold text-slate-900 group-hover:text-indigo-600">{{ item.title }}</h3>
          <p class="text-sm text-slate-600 line-clamp-3">{{ item.summary }}</p>
          <button
            type="button"
            class="motion-underline-link inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
            @click="openArticle(item)"
          >
            {{ ui.viewDetail }}
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </article>
    </div>

    <div
      v-if="articleModalOpen && selectedArticle"
      class="public-dialog-backdrop"
      @click.self="closeArticleModal"
    >
      <div class="public-dialog-panel max-w-4xl p-6 sm:p-8">
        <button
          type="button"
          class="public-dialog-close"
          @click="closeArticleModal"
        >
          &times;
        </button>
        <div class="space-y-3">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">{{ ui.tag }}</p>
          <h3 class="text-2xl font-semibold text-slate-900">{{ selectedArticle.title }}</h3>
          <p class="text-sm font-semibold text-slate-800">{{ selectedArticle.summary }}</p>
          <div v-if="selectedArticle.imageUrl" class="overflow-hidden rounded-2xl border border-slate-100">
            <img :src="selectedArticle.imageUrl" :alt="selectedArticle.title" class="h-64 w-full object-cover" loading="lazy" />
          </div>
          <div class="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
            {{ selectedArticle.content || ui.noExtra }}
          </div>
          <div class="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              @click="closeArticleModal"
            >
              {{ ui.close }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
