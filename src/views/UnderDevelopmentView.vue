<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, RouterLink } from 'vue-router'

const route = useRoute()
const { locale } = useI18n()

const slug = computed(() => (route.params.slug || '').toString())
const formattedTitle = computed(() => {
  if (!slug.value) return copy.value.pageLabel
  const words = slug.value.split('-').filter(Boolean)
  if (!words.length) return copy.value.pageLabel
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
})

const copyByLocale = {
  id: {
    badge: 'Dalam pengembangan',
    pageLabel: 'Halaman ini',
    headerDesc: 'Halaman ini sedang kami kerjakan. Tim desain dan engineering menyiapkan konten serta data pendukungnya.',
    backHome: 'Kembali ke beranda',
    viewOther: 'Lihat informasi lain',
    title: 'Sedang digarap',
    desc: 'Kami menambahkan fitur, ilustrasi, dan data sesuai kebutuhan halaman ini. Jika Anda butuh informasi khusus, hubungi tim CDC agar dapat diprioritaskan.',
    checklist1: 'Integrasi konten & data terbaru',
    checklist2: 'Validasi tampilan & aksesibilitas',
    checklist3: 'Estimasi publikasi segera setelah QA',
    chip1: 'UI in progress',
    chip2: 'Backend ready',
    chip3: 'Konten disiapkan',
  },
  en: {
    badge: 'Under development',
    pageLabel: 'This page',
    headerDesc: 'This page is currently in progress. Our design and engineering teams are preparing content and supporting data.',
    backHome: 'Back to home',
    viewOther: 'See other information',
    title: 'In progress',
    desc: 'We are adding features, illustrations, and data as required for this page. If you need specific information, contact the CDC team.',
    checklist1: 'Latest content and data integration',
    checklist2: 'UI and accessibility validation',
    checklist3: 'Estimated release after QA',
    chip1: 'UI in progress',
    chip2: 'Backend ready',
    chip3: 'Content in preparation',
  },
  ar: {
    badge: 'قيد التطوير',
    pageLabel: 'هذه الصفحة',
    headerDesc: 'هذه الصفحة قيد العمل حاليا. يعمل فريقا التصميم والهندسة على تجهيز المحتوى والبيانات الداعمة.',
    backHome: 'العودة إلى الرئيسية',
    viewOther: 'عرض معلومات أخرى',
    title: 'جار التنفيذ',
    desc: 'نقوم بإضافة الميزات والرسومات والبيانات المناسبة لهذه الصفحة. إذا كنت تحتاج معلومات خاصة، تواصل مع فريق CDC.',
    checklist1: 'تكامل أحدث المحتوى والبيانات',
    checklist2: 'مراجعة الواجهة وإمكانية الوصول',
    checklist3: 'نشر متوقع بعد QA',
    chip1: 'الواجهة قيد التنفيذ',
    chip2: 'الخلفية جاهزة',
    chip3: 'المحتوى قيد التجهيز',
  },
}

const copy = computed(() => copyByLocale[locale.value] || copyByLocale.id)
</script>

<template>
  <div class="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_80px_-40px_rgba(37,99,235,0.35)]">
    <div class="grid gap-0 md:grid-cols-5">
      <div class="relative col-span-2 bg-gradient-to-br from-indigo-600 via-purple-500 to-sky-500 p-6 text-white md:p-8">
        <div class="absolute inset-0 opacity-20" aria-hidden="true">
          <svg class="h-full w-full" viewBox="0 0 300 300" fill="none">
            <circle cx="80" cy="80" r="70" stroke="white" stroke-opacity="0.3" />
            <circle cx="220" cy="160" r="90" stroke="white" stroke-opacity="0.2" />
            <path d="M50 210c40-50 120-40 180 10" stroke="white" stroke-opacity="0.2" stroke-width="8" />
          </svg>
        </div>
        <div class="relative flex h-full flex-col justify-between">
          <div class="space-y-3">
            <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/80">{{ copy.badge }}</p>
            <h1 class="text-3xl font-semibold leading-tight">{{ formattedTitle }}</h1>
            <p class="text-sm text-white/80">
              {{ copy.headerDesc }}
            </p>
          </div>
          <div class="mt-6 flex flex-wrap gap-3">
            <RouterLink
              to="/"
              class="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:brightness-110"
            >
              {{ copy.backHome }}
            </RouterLink>
            <RouterLink
              to="/tentang"
              class="inline-flex items-center justify-center rounded-full border border-white/60 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              {{ copy.viewOther }}
            </RouterLink>
          </div>
        </div>
      </div>
      <div class="col-span-3 p-6 md:p-8">
        <div class="flex flex-col items-center justify-center gap-4 text-center md:flex-row md:items-start md:text-left">
          <div class="flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 via-sky-100 to-emerald-100">
            <svg class="h-16 w-16 text-indigo-600" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="14" y="14" width="36" height="26" rx="4" ry="4" />
              <path d="M20 46h24" />
              <path d="M32 46v6" />
              <path d="M28 52h8" />
              <path d="M24 20h16" />
              <path d="M24 26h10" />
              <circle cx="44" cy="40" r="9" />
              <path d="M44 35v5l3 3" />
            </svg>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-slate-900">{{ copy.title }}</h2>
            <p class="text-sm text-slate-600">{{ copy.desc }}</p>
            <ul class="space-y-2 text-sm text-slate-600">
              <li class="flex items-center gap-2">
                <span class="h-2 w-2 rounded-full bg-emerald-500" />
                {{ copy.checklist1 }}
              </li>
              <li class="flex items-center gap-2">
                <span class="h-2 w-2 rounded-full bg-amber-500" />
                {{ copy.checklist2 }}
              </li>
              <li class="flex items-center gap-2">
                <span class="h-2 w-2 rounded-full bg-sky-500" />
                {{ copy.checklist3 }}
              </li>
            </ul>
            <div class="flex flex-wrap gap-2 text-[12px] font-semibold text-slate-700">
              <span class="rounded-full bg-slate-100 px-3 py-1">{{ copy.chip1 }}</span>
              <span class="rounded-full bg-slate-100 px-3 py-1">{{ copy.chip2 }}</span>
              <span class="rounded-full bg-slate-100 px-3 py-1">{{ copy.chip3 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

