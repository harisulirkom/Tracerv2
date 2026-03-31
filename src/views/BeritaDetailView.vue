<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useNews } from '../stores/news'
import { useLocalizedDynamicContent } from '../composables/useLocalizedDynamicContent'

const route = useRoute()
const router = useRouter()
const { locale } = useI18n()
const { news, fetchNews, loading, error } = useNews()
const { toText, resolveLocalizedString, resolvePublishedStatus, resolveDateValue } =
  useLocalizedDynamicContent(locale)
const loadingDetail = ref(false)

const copyByLocale = {
  id: {
    tag: 'Berita',
    title: 'Detail berita tracer study',
    desc: 'Baca informasi lengkap terkait tracer study dan aktivitas kampus.',
    loading: 'Memuat detail berita...',
    notFound: 'Berita tidak ditemukan atau sudah dihapus.',
    back: 'Kembali ke daftar berita',
    published: 'Dipublikasikan',
    draft: 'Draft',
  },
  en: {
    tag: 'News',
    title: 'Tracer study news detail',
    desc: 'Read complete information about tracer study and campus activities.',
    loading: 'Loading news details...',
    notFound: 'News not found or has been deleted.',
    back: 'Back to news list',
    published: 'Published',
    draft: 'Draft',
  },
  ar: {
    tag: 'الأخبار',
    title: 'تفاصيل أخبار دراسة التتبع',
    desc: 'اطلع على المعلومات الكاملة المتعلقة بدراسة التتبع وأنشطة الجامعة.',
    loading: 'جار تحميل تفاصيل الخبر...',
    notFound: 'الخبر غير موجود أو تم حذفه.',
    back: 'العودة إلى قائمة الأخبار',
    published: 'منشور',
    draft: 'مسودة',
  },
}

const ui = computed(() => copyByLocale[locale.value] || copyByLocale.id)
const localeCode = computed(() => (locale.value === 'ar' ? 'ar-SA' : locale.value === 'en' ? 'en-US' : 'id-ID'))

const berita = computed(() => {
  const idParam = route.params.id
  const idNum = Number(idParam)
  const raw =
    news.value.find((item) => String(item.id) === String(idParam) || item.id === idNum) || null
  if (!raw) return null
  return {
    ...raw,
    title: resolveLocalizedString(raw, 'title'),
    summary: resolveLocalizedString(raw, 'summary'),
    content: resolveLocalizedString(raw, 'content'),
    imageUrl: toText(raw?.imageUrl || raw?.image_url),
    createdAt: resolveDateValue(raw),
    published: resolvePublishedStatus(raw?.published),
  }
})

const formattedDate = computed(() => {
  if (!berita.value) return ''
  return new Date(berita.value.createdAt).toLocaleDateString(localeCode.value, {
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
    } finally {
      loadingDetail.value = false
    }
  }
})
</script>

<template>
  <div class="space-y-8">
    <header class="space-y-3">
      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">{{ ui.tag }}</p>
      <h1 class="text-3xl font-semibold text-slate-900">{{ ui.title }}</h1>
      <p class="text-slate-600">{{ ui.desc }}</p>
    </header>

    <div v-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700">
      {{ error }}
    </div>
    <div
      v-else-if="loading || loadingDetail"
      class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600"
    >
      {{ ui.loading }}
    </div>
    <div v-else-if="!berita" class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
      <p>{{ ui.notFound }}</p>
      <button
        type="button"
        class="mt-4 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        @click="goBack"
      >
        {{ ui.back }}
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
            {{ berita.published ? ui.published : ui.draft }}
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
            {{ ui.back }}
          </button>
        </div>
      </div>
    </article>
  </div>
</template>
