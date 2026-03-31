<script setup>
import { computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuestionnaires } from '../stores/questionnaires'

const router = useRouter()
const { locale } = useI18n()
const { questionnaires, fetchQuestionnaires } = useQuestionnaires()

const goTo = (path) => {
  router.push(path)
}

const copyByLocale = {
  id: {
    tag: 'Kuisioner',
    title: 'Pilih halaman kuisioner yang ingin Anda isi',
    desc: 'Gunakan kuisioner alumni untuk lulusan dan kuisioner pengguna alumni untuk instansi atau perusahaan yang mempekerjakan alumni.',
    chip1: 'Tidak perlu login',
    chip2: 'Data tersimpan lokal',
    chip3: 'Mengikuti kuisioner aktif',
    alumniTag: 'Kuisioner alumni',
    statActiveStatic: 'Aktif (statis)',
    alumniTitle: 'Isi kuisioner alumni',
    alumniDesc: 'Form alumni menggunakan konten statis untuk keperluan uji tampilan.',
    alumniChip: 'Tracer Study 2025 - Kuisioner dibuka',
    timeFallback: '+/-5 menit',
    fillAsAlumni: 'Isi sebagai alumni',
    viewGuide: 'Lihat panduan',
    userTag: 'Kuisioner pengguna alumni',
    userActive: 'Aktif',
    userInactive: 'Menunggu aktivasi',
    userInactiveTitle: 'Kuisioner pengguna belum diaktifkan',
    userInactiveDesc: 'Aktifkan kuisioner pengguna alumni dari dashboard admin untuk mulai menerima penilaian pengguna alumni.',
    waitingAdmin: 'Menunggu aktivasi admin',
    fillAsUser: 'Isi sebagai pengguna alumni',
    viewCriteria: 'Lihat kriteria',
    activeTag: 'Kuisioner aktif',
    activeTitle: 'Daftar kuisioner yang siap diisi',
    activeDesc: 'Daftar ini mengikuti kuisioner yang ditandai aktif oleh admin.',
    openAdmin: 'Buka dashboard admin',
    noActive: 'Belum ada kuisioner yang aktif. Silakan aktifkan kuisioner dari modul admin untuk menampilkan pilihan di halaman ini.',
    step1: 'Langkah 1',
    step1Title: 'Pilih tipe kuisioner',
    step1Desc: 'Pilih sesuai peran Anda: alumni untuk lulusan, pengguna untuk instansi.',
    step2: 'Langkah 2',
    step2Title: 'Isi formulir lengkap',
    step2Desc: 'Isi data sesuai petunjuk. Pertanyaan mengikuti konfigurasi admin.',
    step3: 'Langkah 3',
    step3Title: 'Kirim & simpan',
    step3Desc: 'Setelah terkirim, data tercatat lokal dan ditampilkan di admin.',
  },
  en: {
    tag: 'Questionnaire',
    title: 'Choose the questionnaire page you want to fill in',
    desc: 'Use alumni questionnaire for graduates and alumni user questionnaire for institutions or companies hiring alumni.',
    chip1: 'No login required',
    chip2: 'Data stored locally',
    chip3: 'Follows active questionnaire',
    alumniTag: 'Alumni questionnaire',
    statActiveStatic: 'Active (static)',
    alumniTitle: 'Fill alumni questionnaire',
    alumniDesc: 'The alumni form currently uses static content for display testing.',
    alumniChip: 'Tracer Study 2025 - Questionnaire open',
    timeFallback: '+/-5 minutes',
    fillAsAlumni: 'Fill as alumni',
    viewGuide: 'View guide',
    userTag: 'Alumni user questionnaire',
    userActive: 'Active',
    userInactive: 'Waiting activation',
    userInactiveTitle: 'User questionnaire is not active yet',
    userInactiveDesc: 'Activate alumni user questionnaire from admin dashboard to start collecting user feedback.',
    waitingAdmin: 'Waiting admin activation',
    fillAsUser: 'Fill as alumni user',
    viewCriteria: 'View criteria',
    activeTag: 'Active questionnaire',
    activeTitle: 'List of available questionnaires',
    activeDesc: 'This list follows questionnaires marked active by admin.',
    openAdmin: 'Open admin dashboard',
    noActive: 'No active questionnaire yet. Please activate one from admin module to show options on this page.',
    step1: 'Step 1',
    step1Title: 'Choose questionnaire type',
    step1Desc: 'Choose by role: alumni for graduates, user for institutions.',
    step2: 'Step 2',
    step2Title: 'Fill the full form',
    step2Desc: 'Fill data based on guidance. Questions follow admin configuration.',
    step3: 'Step 3',
    step3Title: 'Submit & save',
    step3Desc: 'After submission, data is stored locally and shown in admin.',
  },
  ar: {
    tag: 'الاستبيان',
    title: 'اختر صفحة الاستبيان التي تريد تعبئتها',
    desc: 'استخدم استبيان الخريجين للمتخرجين واستبيان مستخدمي الخريجين للمؤسسات أو الشركات.',
    chip1: 'لا حاجة لتسجيل الدخول',
    chip2: 'يتم حفظ البيانات محليا',
    chip3: 'يتبع الاستبيان النشط',
    alumniTag: 'استبيان الخريجين',
    statActiveStatic: 'نشط (ثابت)',
    alumniTitle: 'تعبئة استبيان الخريجين',
    alumniDesc: 'يستخدم نموذج الخريجين حاليا محتوى ثابتا لاختبار العرض.',
    alumniChip: 'دراسة التتبع 2025 - الاستبيان مفتوح',
    timeFallback: '+/-5 دقائق',
    fillAsAlumni: 'تعبئة كخريج',
    viewGuide: 'عرض الدليل',
    userTag: 'استبيان مستخدمي الخريجين',
    userActive: 'نشط',
    userInactive: 'بانتظار التفعيل',
    userInactiveTitle: 'استبيان المستخدم غير مفعل بعد',
    userInactiveDesc: 'فعّل استبيان مستخدمي الخريجين من لوحة الإدارة لبدء استقبال التقييمات.',
    waitingAdmin: 'بانتظار تفعيل الإدارة',
    fillAsUser: 'تعبئة كمستخدم خريجين',
    viewCriteria: 'عرض المعايير',
    activeTag: 'الاستبيانات النشطة',
    activeTitle: 'قائمة الاستبيانات الجاهزة',
    activeDesc: 'تعكس هذه القائمة الاستبيانات التي فعّلتها الإدارة.',
    openAdmin: 'فتح لوحة الإدارة',
    noActive: 'لا يوجد استبيان نشط حاليا. يرجى التفعيل من لوحة الإدارة لإظهاره هنا.',
    step1: 'الخطوة 1',
    step1Title: 'اختر نوع الاستبيان',
    step1Desc: 'اختر حسب دورك: الخريجون للمتخرجين، والمستخدم للمؤسسات.',
    step2: 'الخطوة 2',
    step2Title: 'املأ النموذج كاملا',
    step2Desc: 'أدخل البيانات حسب التعليمات. الأسئلة تتبع إعدادات الإدارة.',
    step3: 'الخطوة 3',
    step3Title: 'أرسل واحفظ',
    step3Desc: 'بعد الإرسال، تحفظ البيانات محليا وتظهر في لوحة الإدارة.',
  },
}

const ui = computed(() => copyByLocale[locale.value] || copyByLocale.id)

const normalizeAudience = (value) => {
  const val = String(value || '').trim().toLowerCase()
  if (val === 'pengguna' || val.startsWith('pengguna')) return 'pengguna'
  if (val === 'umum' || val.startsWith('umum')) return 'umum'
  return 'alumni'
}

const audienceMap = computed(() => ({
  alumni: ui.value.alumniTag,
  pengguna: ui.value.userTag,
  umum: locale.value === 'ar' ? 'عام' : locale.value === 'en' ? 'General' : 'Umum',
}))

const activeCards = computed(() =>
  questionnaires.value
    .filter((item) => Boolean(item?.active))
    .map((item, index) => {
      const audienceKey = normalizeAudience(item.audience)
      return {
        id: item.id || `${audienceKey}-${index}`,
        audience: audienceMap.value[audienceKey] || audienceMap.value.alumni,
        title: item.title || (audienceKey === 'pengguna' ? ui.value.userTag : ui.value.alumniTag),
        description:
          item.description ||
          (audienceKey === 'pengguna' ? ui.value.userInactiveDesc : ui.value.alumniDesc),
        estimatedTime: item.estimatedTime || ui.value.timeFallback,
        chipText: item.chipText || ui.value.alumniChip,
      }
    }),
)

const activePengguna = computed(() =>
  questionnaires.value.find((item) => Boolean(item?.active) && normalizeAudience(item.audience) === 'pengguna') || null,
)

onMounted(() => {
  fetchQuestionnaires({}, { publicMode: true, requestConfig: { timeout: 1000 } })
})
</script>

<template>
  <div class="space-y-8">
    <header class="space-y-3 rounded-3xl bg-gradient-to-r from-indigo-50 via-sky-50 to-cyan-50 p-6 text-slate-900 shadow-sm shadow-indigo-100">
      <p class="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">{{ ui.tag }}</p>
      <h1 class="text-3xl font-semibold leading-tight sm:text-4xl">{{ ui.title }}</h1>
      <p class="text-slate-600 sm:max-w-3xl">{{ ui.desc }}</p>
      <div class="flex flex-wrap gap-2 text-xs font-semibold text-indigo-700">
        <span class="rounded-full bg-white px-3 py-1">{{ ui.chip1 }}</span>
        <span class="rounded-full bg-white px-3 py-1">{{ ui.chip2 }}</span>
        <span class="rounded-full bg-white px-3 py-1">{{ ui.chip3 }}</span>
      </div>
    </header>

    <section class="grid gap-4 lg:grid-cols-2">
      <article class="group relative overflow-hidden rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm shadow-indigo-100 transition hover:shadow-md">
        <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-sky-500/5 to-cyan-400/10" />
        <div class="relative space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
              <span class="h-2 w-2 rounded-full bg-indigo-500" />
              {{ ui.alumniTag }}
            </div>
            <span class="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700">
              {{ ui.statActiveStatic }}
            </span>
          </div>
          <h2 class="text-2xl font-semibold text-slate-900">{{ ui.alumniTitle }}</h2>
          <p class="text-sm text-slate-600">{{ ui.alumniDesc }}</p>
          <div class="flex flex-wrap gap-2 text-xs font-semibold text-indigo-700">
            <span class="rounded-full bg-indigo-50 px-3 py-1">{{ ui.alumniChip }}</span>
            <span class="rounded-full bg-indigo-50 px-3 py-1">{{ ui.timeFallback }}</span>
          </div>

          <div class="pt-2">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              @click="goTo('/kuisioner/alumni')"
            >
              {{ ui.fillAsAlumni }}
            </button>
            <RouterLink
              to="/tentang"
              class="ml-3 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              {{ ui.viewGuide }}
            </RouterLink>
          </div>
        </div>
      </article>

      <article class="group relative overflow-hidden rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm shadow-emerald-100 transition hover:shadow-md">
        <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-400/10" />
        <div class="relative space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
              <span class="h-2 w-2 rounded-full bg-emerald-500" />
              {{ ui.userTag }}
            </div>
            <span class="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
              {{ activePengguna ? ui.userActive : ui.userInactive }}
            </span>
          </div>
          <h2 class="text-2xl font-semibold text-slate-900">
            {{ activePengguna?.title || ui.userInactiveTitle }}
          </h2>
          <p class="text-sm text-slate-600">
            {{ activePengguna?.description || ui.userInactiveDesc }}
          </p>

          <div class="flex flex-wrap gap-2 text-xs font-semibold text-emerald-700">
            <span class="rounded-full bg-emerald-50 px-3 py-1">
              {{ activePengguna?.chipText || ui.waitingAdmin }}
            </span>
            <span class="rounded-full bg-emerald-50 px-3 py-1">
              {{ activePengguna?.estimatedTime || ui.timeFallback }}
            </span>
          </div>

          <div class="pt-2">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              :disabled="!activePengguna"
              @click="goTo('/kuisioner/pengguna')"
            >
              {{ ui.fillAsUser }}
            </button>
            <RouterLink
              to="/tentang"
              class="ml-3 text-sm font-semibold text-emerald-600 hover:text-emerald-500"
            >
              {{ ui.viewCriteria }}
            </RouterLink>
          </div>
        </div>
      </article>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{{ ui.activeTag }}</p>
          <h3 class="text-lg font-semibold text-slate-900">{{ ui.activeTitle }}</h3>
          <p class="text-xs text-slate-500">{{ ui.activeDesc }}</p>
        </div>
        <RouterLink
          to="/login"
          class="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          {{ ui.openAdmin }}
        </RouterLink>
      </div>

      <div v-if="!activeCards.length" class="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        {{ ui.noActive }}
      </div>

      <div v-else class="mt-4 grid gap-3 md:grid-cols-2">
        <article
          v-for="card in activeCards"
          :key="card.id"
          class="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-700"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-2">
              <div class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-indigo-700">
                <span class="h-2 w-2 rounded-full bg-indigo-500" />
                {{ card.audience }}
              </div>
              <h4 class="text-base font-semibold text-slate-900">{{ card.title }}</h4>
              <p class="text-xs text-slate-600">{{ card.description }}</p>
            </div>
            <span class="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-700">{{ card.estimatedTime }}</span>
          </div>
          <p class="mt-3 text-[11px] font-semibold text-slate-500">
            {{ card.chipText }}
          </p>
        </article>
      </div>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="grid gap-4 sm:grid-cols-3">
        <div class="rounded-2xl bg-indigo-50 p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">{{ ui.step1 }}</p>
          <h4 class="mt-2 text-sm font-semibold text-slate-900">{{ ui.step1Title }}</h4>
          <p class="mt-1 text-xs text-slate-600">{{ ui.step1Desc }}</p>
        </div>
        <div class="rounded-2xl bg-emerald-50 p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">{{ ui.step2 }}</p>
          <h4 class="mt-2 text-sm font-semibold text-slate-900">{{ ui.step2Title }}</h4>
          <p class="mt-1 text-xs text-slate-600">{{ ui.step2Desc }}</p>
        </div>
        <div class="rounded-2xl bg-slate-50 p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">{{ ui.step3 }}</p>
          <h4 class="mt-2 text-sm font-semibold text-slate-900">{{ ui.step3Title }}</h4>
          <p class="mt-1 text-xs text-slate-600">{{ ui.step3Desc }}</p>
        </div>
      </div>
    </section>
  </div>
</template>
