<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuestionnaires } from '../stores/questionnaires'

const { questionnaires, fetchQuestionnaires, loading, error } = useQuestionnaires()
const { locale } = useI18n()

const variants = ['left', 'right', 'top']

const copyByLocale = {
  id: {
    tag: 'Daftar Kuisioner',
    titleTop: 'Features with Isometric Blocks',
    titleBottom: 'untuk halaman publik kuisioner',
    desc: 'Halaman ini hanya menampilkan kuisioner yang berstatus aktif dari panel admin.',
    active: 'Aktif',
    cta: 'Isi kuisioner',
    estTime: 'Estimasi waktu',
    audience: 'Audience',
    noActive: 'Belum ada kuisioner aktif yang dipublikasikan oleh admin.',
    alumni: {
      label: 'Alumni',
      fallback:
        'Form tracer untuk lulusan: data profil, masa tunggu kerja, kesesuaian bidang, dan masukan pengembangan kurikulum.',
    },
    pengguna: {
      label: 'Pengguna Alumni',
      fallback:
        'Penilaian dari instansi atau perusahaan terhadap performa alumni serta kebutuhan kompetensi tenaga kerja.',
    },
    umum: {
      label: 'Umum',
      fallback: 'Kuisioner umum untuk kebutuhan survei non-spesifik alumni maupun pengguna alumni.',
    },
  },
  en: {
    tag: 'Questionnaire List',
    titleTop: 'Features with Isometric Blocks',
    titleBottom: 'for public questionnaire page',
    desc: 'This page only shows questionnaires marked active from the admin panel.',
    active: 'Active',
    cta: 'Fill questionnaire',
    estTime: 'Estimated time',
    audience: 'Audience',
    noActive: 'No active questionnaire has been published by admin yet.',
    alumni: {
      label: 'Alumni',
      fallback:
        'Tracer form for graduates: profile data, waiting period, field relevance, and curriculum feedback.',
    },
    pengguna: {
      label: 'Alumni User',
      fallback:
        'Assessment from institutions or companies regarding alumni performance and competency needs.',
    },
    umum: {
      label: 'General',
      fallback: 'General questionnaire for non-specific survey needs for alumni and alumni users.',
    },
  },
  ar: {
    tag: 'قائمة الاستبيانات',
    titleTop: 'ميزات مع كتل متساوية القياس',
    titleBottom: 'لصفحة الاستبيانات العامة',
    desc: 'تعرض هذه الصفحة فقط الاستبيانات النشطة من لوحة الإدارة.',
    active: 'نشط',
    cta: 'تعبئة الاستبيان',
    estTime: 'المدة المتوقعة',
    audience: 'الفئة',
    noActive: 'لا يوجد استبيان نشط منشور من الإدارة حاليا.',
    alumni: {
      label: 'الخريجون',
      fallback:
        'نموذج تتبع للخريجين: بيانات الملف الشخصي وفترة الانتظار وملاءمة التخصص وملاحظات تطوير المنهج.',
    },
    pengguna: {
      label: 'مستخدمو الخريجين',
      fallback:
        'تقييم من المؤسسات أو الشركات حول أداء الخريجين واحتياجات الكفاءات.',
    },
    umum: {
      label: 'عام',
      fallback: 'استبيان عام للاحتياجات غير المتخصصة للخريجين ومستخدمي الخريجين.',
    },
  },
}

const ui = computed(() => copyByLocale[locale.value] || copyByLocale.id)

const audienceConfig = computed(() => ({
  alumni: {
    label: ui.value.alumni.label,
    to: '/kuisioner/alumni',
    fallbackDescription: ui.value.alumni.fallback,
  },
  pengguna: {
    label: ui.value.pengguna.label,
    to: '/kuisioner/pengguna',
    fallbackDescription: ui.value.pengguna.fallback,
  },
  umum: {
    label: ui.value.umum.label,
    to: '/kuisioner/umum',
    fallbackDescription: ui.value.umum.fallback,
  },
}))

const normalizeAudience = (audience) => {
  const value = String(audience || '').trim().toLowerCase()
  if (value === 'pengguna' || value.startsWith('pengguna')) return 'pengguna'
  if (value === 'umum' || value.startsWith('umum')) return 'umum'
  return 'alumni'
}

const activeCards = computed(() =>
  questionnaires.value
    .filter((item) => Boolean(item?.active))
    .map((item, index) => {
      const audience = normalizeAudience(item.audience)
      const config = audienceConfig.value[audience] || audienceConfig.value.alumni
      return {
        id: item.id || `${audience}-${index}`,
        title: item.title?.trim() || `Questionnaire ${config.label}`,
        description: item.description?.trim() || config.fallbackDescription,
        badge: ui.value.active,
        cta: ui.value.cta,
        to: config.to,
        audienceLabel: config.label,
        estimatedTime: item.estimatedTime?.trim() || '',
        variant: variants[index % variants.length],
      }
    }),
)

onMounted(() => {
  fetchQuestionnaires({}, { publicMode: true, requestConfig: { timeout: 1000 } })
})
</script>

<template>
  <section class="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-40px_rgba(14,116,144,0.35)] sm:p-8">
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <div class="absolute -left-12 -top-10 h-56 w-56 rounded-full bg-sky-100/70 blur-3xl"></div>
      <div class="absolute bottom-0 right-0 h-60 w-60 rounded-full bg-indigo-100/60 blur-3xl"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(100,116,139,0.16)_1px,transparent_0)] [background-size:22px_22px] opacity-30"></div>
    </div>

    <div class="relative">
      <div class="max-w-3xl">
        <p class="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">{{ ui.tag }}</p>
        <h1 class="mt-2 text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
          {{ ui.titleTop }}
          <span class="block bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
            {{ ui.titleBottom }}
          </span>
        </h1>
        <p class="mt-3 text-sm text-slate-600 sm:text-base">
          {{ ui.desc }}
        </p>
      </div>

      <p v-if="error" class="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
        {{ error }}
      </p>

      <div class="mt-8 grid gap-4 lg:grid-cols-3">
        <article
          v-if="loading"
          v-for="index in 3"
          :key="`skeleton-${index}`"
          class="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm"
        >
          <div class="h-4 w-24 animate-pulse rounded bg-slate-200"></div>
          <div class="mt-3 h-5 w-3/4 animate-pulse rounded bg-slate-200"></div>
          <div class="mt-2 h-4 w-full animate-pulse rounded bg-slate-100"></div>
          <div class="mt-2 h-4 w-5/6 animate-pulse rounded bg-slate-100"></div>
          <div class="mt-4 h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-50"></div>
        </article>
        <article
          v-else-if="activeCards.length"
          v-for="card in activeCards"
          :key="card.id"
          class="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
        >
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-base font-semibold text-slate-900">{{ card.title }}</h2>
            <span
              class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              :class="card.to ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'"
            >
              {{ card.badge }}
            </span>
          </div>
          <p class="mt-2 text-sm leading-relaxed text-slate-600">
            {{ card.description }}
          </p>
          <p v-if="card.estimatedTime" class="mt-2 text-xs font-semibold text-slate-500">
            {{ ui.estTime }}: {{ card.estimatedTime }}
          </p>
          <p class="mt-1 text-xs text-slate-500">
            {{ ui.audience }}: {{ card.audienceLabel }}
          </p>

          <div class="mt-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3">
            <svg viewBox="0 0 184 140" class="h-28 w-full">
              <polygon
                class="iso-face fill-slate-100 stroke-slate-400/80 transition-all duration-500 ease-out"
                :class="{
                  'group-hover:translate-x-2 group-hover:stroke-sky-500': card.variant === 'left',
                }"
                points="30,74 82,44 82,104 30,134"
              />
              <polygon
                class="iso-face fill-slate-50 stroke-slate-400/80 transition-all duration-500 ease-out"
                :class="{
                  'group-hover:-translate-x-2 group-hover:stroke-sky-500': card.variant === 'right',
                }"
                points="82,44 154,60 154,118 82,104"
              />
              <polygon
                class="iso-face fill-white stroke-slate-400/80 transition-all duration-500 ease-out"
                :class="{
                  'group-hover:-translate-y-2 group-hover:stroke-sky-500': card.variant === 'top',
                }"
                points="30,74 82,44 154,60 101,90"
              />
            </svg>
          </div>

          <div class="mt-4">
            <RouterLink
              v-if="card.to"
              :to="card.to"
              class="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              {{ card.cta }}
            </RouterLink>
            <span
              v-else
              class="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600"
            >
              {{ card.cta }}
            </span>
          </div>
        </article>
        <article
          v-else
          class="lg:col-span-3 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-800"
        >
          {{ ui.noActive }}
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.iso-face {
  transform-box: fill-box;
  transform-origin: center;
}
</style>
