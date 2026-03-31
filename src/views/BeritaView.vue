<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNews } from '../stores/news'
import { useLocalizedDynamicContent } from '../composables/useLocalizedDynamicContent'

const { news, fetchNews, loading, error } = useNews()
const { locale } = useI18n()
const {
  toText,
  resolveLocalizedString,
  resolveLocalizedTags,
  resolveSummary,
  resolvePublishedStatus,
  resolveDateValue,
} = useLocalizedDynamicContent(locale)

const ALL_TAG = '__all__'
const selectedTag = ref(ALL_TAG)

const copyByLocale = {
  id: {
    tag: 'Berita',
    title: 'Kabar terbaru tracer study',
    desc: 'Ikuti pengumuman resmi, pembaruan sistem, dan agenda penting CDC untuk alumni.',
    category: 'Kategori',
    all: 'Semua',
    loading: 'Memuat berita...',
    emptyPrefix: 'Tidak ada berita untuk kategori',
    readMore: 'Baca selengkapnya',
    preview: 'Preview berita',
    noSummary: 'Ringkasan berita belum tersedia.',
    placeholderCard: 'Berita CDC',
    audienceFallback: 'Umum',
  },
  en: {
    tag: 'News',
    title: 'Latest tracer study updates',
    desc: 'Follow official announcements, system updates, and key CDC agendas for alumni.',
    category: 'Category',
    all: 'All',
    loading: 'Loading news...',
    emptyPrefix: 'No news available for category',
    readMore: 'Read more',
    preview: 'News preview',
    noSummary: 'News summary is not available yet.',
    placeholderCard: 'CDC News',
    audienceFallback: 'General',
  },
  ar: {
    tag: 'الأخبار',
    title: 'آخر تحديثات دراسة التتبع',
    desc: 'تابع الإعلانات الرسمية وتحديثات النظام وأهم أجندات CDC للخريجين.',
    category: 'الفئة',
    all: 'الكل',
    loading: 'جار تحميل الأخبار...',
    emptyPrefix: 'لا توجد أخبار ضمن الفئة',
    readMore: 'قراءة المزيد',
    preview: 'معاينة الخبر',
    noSummary: 'ملخص الخبر غير متوفر حاليا.',
    placeholderCard: 'أخبار CDC',
    audienceFallback: 'عام',
  },
}

const fallbackByLocale = {
  id: [
    {
      title: 'Kuisioner tracer 2025 dibuka',
      createdAt: '2025-01-10T09:00:00.000Z',
      summary: 'Periode pengisian tracer study 2025 resmi dimulai, target respon minimal 70%.',
      imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=60',
      tags: ['Tracer Study', 'Pengumuman'],
    },
    {
      title: 'Rilis dashboard karier',
      createdAt: '2025-01-05T09:00:00.000Z',
      summary: 'Dashboard baru menampilkan peta persebaran alumni dan ringkasan pekerjaan populer.',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=60',
      tags: ['Produk', 'Analitik'],
    },
    {
      title: 'Integrasi ke sistem akademik',
      createdAt: '2024-12-18T09:00:00.000Z',
      summary: 'Data tracer kini terhubung ke SIAKAD untuk sinkronisasi data lulusan dan prodi.',
      imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=60',
      tags: ['Integrasi', 'Sistem'],
    },
    {
      title: 'Pelatihan admin tracer',
      createdAt: '2024-12-08T09:00:00.000Z',
      summary: 'Workshop untuk admin baru mencakup pembuatan kuisioner dan ekspor laporan.',
      imageUrl: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=60',
      tags: ['Pelatihan', 'Admin'],
    },
  ],
  en: [
    {
      title: 'Tracer questionnaire 2025 is now open',
      createdAt: '2025-01-10T09:00:00.000Z',
      summary: 'The 2025 tracer study period has officially started with a minimum 70% response target.',
      imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=60',
      tags: ['Tracer Study', 'Announcement'],
    },
    {
      title: 'Career dashboard released',
      createdAt: '2025-01-05T09:00:00.000Z',
      summary: 'The new dashboard highlights alumni distribution and popular career summaries.',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=60',
      tags: ['Product', 'Analytics'],
    },
    {
      title: 'Academic system integration',
      createdAt: '2024-12-18T09:00:00.000Z',
      summary: 'Tracer data is now connected with the academic system for graduate and program sync.',
      imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=60',
      tags: ['Integration', 'System'],
    },
    {
      title: 'Tracer admin training',
      createdAt: '2024-12-08T09:00:00.000Z',
      summary: 'Workshop for new admins covers questionnaire setup and report export workflows.',
      imageUrl: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=60',
      tags: ['Training', 'Admin'],
    },
  ],
  ar: [
    {
      title: 'فتح استبيان التتبع 2025',
      createdAt: '2025-01-10T09:00:00.000Z',
      summary: 'تم رسميا بدء فترة دراسة التتبع 2025 مع هدف استجابة لا يقل عن 70%.',
      imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=60',
      tags: ['دراسة التتبع', 'إعلان'],
    },
    {
      title: 'إطلاق لوحة معلومات مهنية',
      createdAt: '2025-01-05T09:00:00.000Z',
      summary: 'تعرض اللوحة الجديدة انتشار الخريجين وملخصات المسارات المهنية الأكثر شيوعا.',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=60',
      tags: ['المنتج', 'تحليلات'],
    },
    {
      title: 'تكامل مع النظام الأكاديمي',
      createdAt: '2024-12-18T09:00:00.000Z',
      summary: 'أصبحت بيانات التتبع متصلة بالنظام الأكاديمي لمزامنة الخريجين والبرامج.',
      imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=60',
      tags: ['تكامل', 'نظام'],
    },
    {
      title: 'تدريب مسؤولي التتبع',
      createdAt: '2024-12-08T09:00:00.000Z',
      summary: 'ورشة للمشرفين الجدد تشمل إعداد الاستبيان وتصدير التقارير.',
      imageUrl: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=60',
      tags: ['تدريب', 'إدارة'],
    },
  ],
}

const ui = computed(() => copyByLocale[locale.value] || copyByLocale.id)
const localeCode = computed(() => (locale.value === 'ar' ? 'ar-SA' : locale.value === 'en' ? 'en-US' : 'id-ID'))

const normalizeDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString()
}

const formatDate = (value) => {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString(localeCode.value, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch (e) {
    return '-'
  }
}

const beritaList = computed(() => {
  const dynamic = news.value
    .filter((item) => resolvePublishedStatus(item?.published))
    .map((item, index) => ({
      key: `news-${item?.id || index}`,
      routeId: item?.id ?? null,
      title: resolveLocalizedString(item, 'title') || 'Untitled news',
      createdAt: normalizeDate(resolveDateValue(item)),
      dateLabel: formatDate(resolveDateValue(item)),
      summary: resolveSummary(item, ui.value.noSummary),
      imageUrl: toText(item?.imageUrl || item?.image_url),
      tags: resolveLocalizedTags(item, ui.value.audienceFallback),
    }))

  if (dynamic.length) return dynamic

  const fallback = fallbackByLocale[locale.value] || fallbackByLocale.id
  return fallback.map((item, index) => ({
    key: `fallback-${index}`,
    routeId: null,
    title: item.title,
    createdAt: normalizeDate(item.createdAt),
    dateLabel: formatDate(item.createdAt),
    summary: item.summary,
    imageUrl: item.imageUrl,
    tags: resolveLocalizedTags(item, ui.value.audienceFallback),
  }))
})

const tagOptions = computed(() => {
  const counts = new Map()
  beritaList.value.forEach((item) => {
    const uniqueTags = Array.from(new Set(item.tags))
    uniqueTags.forEach((tag) => {
      counts.set(tag, (counts.get(tag) || 0) + 1)
    })
  })

  const tags = Array.from(counts.entries())
    .map(([name, count]) => ({ key: name, name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, localeCode.value))

  return [{ key: ALL_TAG, name: ui.value.all, count: beritaList.value.length }, ...tags]
})

const filteredBerita = computed(() => {
  if (selectedTag.value === ALL_TAG) return beritaList.value
  return beritaList.value.filter((item) => item.tags.includes(selectedTag.value))
})

watch(
  [tagOptions, locale],
  ([options]) => {
    const exists = options.some((item) => item.key === selectedTag.value)
    if (!exists) selectedTag.value = ALL_TAG
  },
  { immediate: true },
)

const chooseTag = (tagKey) => {
  selectedTag.value = tagKey
}

onMounted(() => {
  fetchNews()
})
</script>

<template>
  <div class="public-page">
    <section class="public-hero-panel motion-card-sheen">
      <div class="news-hero-pattern absolute inset-0 opacity-80" />
      <div class="absolute inset-0 bg-gradient-to-b from-indigo-50/70 via-white/70 to-white" />
      <div class="relative z-10 flex min-h-[260px] flex-col justify-center gap-7 p-6 sm:p-8 lg:p-10">
        <div class="space-y-3">
          <p class="public-kicker">{{ ui.tag }}</p>
          <h1 class="public-section-title">{{ ui.title }}</h1>
          <p class="public-section-subtitle sm:text-base">
            {{ ui.desc }}
          </p>
        </div>

        <div class="space-y-3">
          <div class="hidden flex-wrap gap-2 md:flex">
            <button
              v-for="tag in tagOptions"
              :key="tag.key"
              type="button"
              class="inline-flex h-9 items-center gap-2 rounded-lg border px-2.5 pl-3 text-sm font-semibold transition"
              :class="
                selectedTag === tag.key
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              "
              @click="chooseTag(tag.key)"
            >
              <span>{{ tag.name }}</span>
              <span
                class="inline-flex h-6 min-w-6 items-center justify-center rounded-md border px-1 text-xs font-semibold"
                :class="
                  selectedTag === tag.key
                    ? 'border-indigo-300 bg-white/95 text-indigo-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                "
              >
                {{ tag.count }}
              </span>
            </button>
          </div>

          <div class="md:hidden">
            <label for="news-filter-tag" class="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {{ ui.category }}
            </label>
            <select
              id="news-filter-tag"
              v-model="selectedTag"
              class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none ring-0 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option v-for="tag in tagOptions" :key="`mobile-${tag.key}`" :value="tag.key">
                {{ tag.name }} ({{ tag.count }})
              </option>
            </select>
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
    <div
      v-else-if="!filteredBerita.length"
      class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600"
    >
      {{ ui.emptyPrefix }} <span class="font-semibold">{{ selectedTag === ALL_TAG ? ui.all : selectedTag }}</span>.
    </div>

    <div
      v-else
      class="public-news-grid"
    >
      <article
        v-for="(berita, beritaIdx) in filteredBerita"
        :key="berita.key"
        class="public-news-card motion-card-sheen motion-delay-item group relative block"
        :style="{ '--stagger-index': beritaIdx }"
      >
        <RouterLink
          v-if="berita.routeId"
          :to="`/berita/${berita.routeId}`"
          class="absolute inset-0 z-20"
          :aria-label="`${ui.readMore} ${berita.title}`"
        />
        <div class="flex h-full flex-col">
          <div class="relative h-48 overflow-hidden">
            <img
              v-if="berita.imageUrl"
              :src="berita.imageUrl"
              :alt="berita.title"
              class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div v-else class="flex h-full items-center justify-center bg-gradient-to-br from-indigo-100 via-sky-100 to-white">
              <span class="rounded-full border border-white/80 bg-white/70 px-3 py-1 text-xs font-semibold text-indigo-700">
                {{ ui.placeholderCard }}
              </span>
            </div>
          </div>

          <div class="flex flex-1 flex-col gap-3 p-5">
            <div class="flex items-center justify-between gap-3">
              <span class="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                {{ berita.tags[0] || ui.audienceFallback }}
              </span>
              <time class="text-xs font-semibold text-slate-500">{{ berita.dateLabel }}</time>
            </div>

            <h2 class="text-xl font-semibold leading-snug text-slate-900 group-hover:underline group-hover:underline-offset-4">
              {{ berita.title }}
            </h2>
            <p class="text-sm text-slate-600 line-clamp-3">{{ berita.summary }}</p>

            <div class="mt-auto pt-1">
              <span
                class="motion-underline-link inline-flex items-center gap-2 text-sm font-semibold"
                :class="berita.routeId ? 'text-indigo-600' : 'text-slate-400'"
              >
                {{ berita.routeId ? ui.readMore : ui.preview }}
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.news-hero-pattern {
  background-image:
    linear-gradient(to right, rgba(99, 102, 241, 0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(15, 23, 42, 0.06) 1px, transparent 1px);
  background-size: 30px 30px;
  -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.9), transparent 82%);
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.9), transparent 82%);
}
</style>
