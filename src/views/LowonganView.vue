<script setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useJobs } from '../stores/jobs'
import { useLocalizedDynamicContent } from '../composables/useLocalizedDynamicContent'

const { jobs, fetchJobs, loading, error } = useJobs()
const { locale } = useI18n()
const {
  readPath,
  toText,
  resolveLocalizedString,
  resolveLocalizedArray,
} = useLocalizedDynamicContent(locale)

const copyByLocale = {
  id: {
    pageTag: 'Lowongan Kerja',
    pageTitle: 'Portal lowongan dan magang CDC UIN Kediri',
    pageDesc:
      'Jelajahi peluang terbaru, temukan lowongan sesuai fakultas/prodi, dan bangun kolaborasi dengan mitra industri.',
    latestCta: 'Lihat lowongan terbaru',
    submitCta: 'Submit lowongan',
    sectionCards: [
      {
        id: 'lowongan-terbaru',
        title: 'Lowongan Terbaru',
        desc: 'Kumpulan posting pekerjaan dan magang paling baru yang masuk ke CDC UIN Kediri.',
        badge: 'Update harian',
      },
      {
        id: 'lowongan-fakultas-prodi',
        title: 'Lowongan Berdasarkan Fakultas/Prodi',
        desc: 'Filter peluang yang relevan dengan jurusan, konsentrasi, atau minat alumni.',
        badge: 'Filter prodi',
      },
      {
        id: 'lowongan-magang',
        title: 'Lowongan Magang',
        desc: 'Program magang/PKL yang dikurasi bersama mitra industri untuk mahasiswa dan alumni baru.',
        badge: 'PKL',
      },
      {
        id: 'perusahaan-mitra',
        title: 'Perusahaan Mitra',
        desc: 'Profil singkat perusahaan rekanan serta daftar lowongan aktif dari masing-masing mitra.',
        badge: 'Mitra',
      },
    ],
    cardChips: ['Katalog', 'Filter', 'Notifikasi'],
    latestTag: 'Lowongan terbaru',
    latestTitle: 'Katalog terbaru & detail lengkap',
    latestDesc: 'Klik lihat lengkap untuk membuka rincian lowongan.',
    tabs: {
      all: 'Semua',
      kerja: 'Kerja',
      magang: 'Magang',
      pkl: 'PKL',
    },
    loadingText: 'Memuat lowongan...',
    emptyText: 'Belum ada lowongan pada kategori ini. Silakan cek kembali atau gunakan filter lain.',
    typeLabels: {
      kerja: 'Lowongan kerja',
      magang: 'Magang',
      pkl: 'PKL',
    },
    deadline: 'Deadline',
    location: 'Lokasi',
    mode: 'Mode',
    type: 'Jenis',
    detail: 'Lihat lengkap',
    submitTag: 'Submit Lowongan',
    submitTitle: 'Buka peluang bagi alumni dan mahasiswa',
    submitDesc:
      'Perusahaan mitra dapat mengirimkan detail lowongan (deskripsi pekerjaan, kualifikasi, lokasi, deadline, dan kontak HR) untuk dipublikasikan pada portal CDC UIN Kediri.',
    submitBullets: [
      'Tim CDC akan melakukan kurasi sebelum tayang.',
      'Dukungan publikasi multi-channel (email, WhatsApp blast, dan poster digital).',
      'Opsi penjadwalan webinar/company session untuk talent branding.',
    ],
    submitEmail: 'Kirim via email',
    submitPartners: 'Lihat daftar mitra ->',
    modalTitle: 'Rincian Lowongan',
    summary: 'Ringkasan Posisi',
    compensation: 'Kompensasi & Benefit',
    responsibilities: 'Tanggung Jawab Utama',
    qualifications: 'Kualifikasi & Persyaratan',
    education: 'Pendidikan',
    experience: 'Pengalaman',
    skills: 'Keterampilan',
    other: 'Kriteria lain',
    jobDetails: 'Detail Pekerjaan',
    jobType: 'Jenis Pekerjaan',
    applyMethod: 'Cara Melamar',
    close: 'Tutup',
  },
  en: {
    pageTag: 'Job Vacancies',
    pageTitle: 'CDC UIN Kediri job and internship portal',
    pageDesc:
      'Explore the latest opportunities, find vacancies by faculty/major, and build collaboration with industry partners.',
    latestCta: 'View latest vacancies',
    submitCta: 'Submit vacancy',
    sectionCards: [
      {
        id: 'lowongan-terbaru',
        title: 'Latest Vacancies',
        desc: 'A collection of the newest job and internship postings received by CDC UIN Kediri.',
        badge: 'Daily updates',
      },
      {
        id: 'lowongan-fakultas-prodi',
        title: 'Vacancies by Faculty/Major',
        desc: 'Filter opportunities relevant to alumni majors, concentrations, or interests.',
        badge: 'Major filter',
      },
      {
        id: 'lowongan-magang',
        title: 'Internship Vacancies',
        desc: 'Internship programs curated with industry partners for students and recent alumni.',
        badge: 'Internship',
      },
      {
        id: 'perusahaan-mitra',
        title: 'Partner Companies',
        desc: 'Brief partner profiles and active vacancy listings from each partner company.',
        badge: 'Partner',
      },
    ],
    cardChips: ['Catalog', 'Filter', 'Notifications'],
    latestTag: 'Latest vacancies',
    latestTitle: 'Latest catalog & full details',
    latestDesc: 'Click view details to open vacancy details.',
    tabs: {
      all: 'All',
      kerja: 'Jobs',
      magang: 'Internship',
      pkl: 'PKL',
    },
    loadingText: 'Loading vacancies...',
    emptyText: 'No vacancies in this category yet. Please check again or use another filter.',
    typeLabels: {
      kerja: 'Job vacancy',
      magang: 'Internship',
      pkl: 'PKL',
    },
    deadline: 'Deadline',
    location: 'Location',
    mode: 'Mode',
    type: 'Type',
    detail: 'View details',
    submitTag: 'Submit Vacancy',
    submitTitle: 'Open opportunities for alumni and students',
    submitDesc:
      'Partner companies can submit vacancy details (job description, qualifications, location, deadline, and HR contact) to be published on the CDC UIN Kediri portal.',
    submitBullets: [
      'CDC team will curate submissions before publication.',
      'Multi-channel publishing support (email, WhatsApp blast, and digital posters).',
      'Optional webinar/company session scheduling for talent branding.',
    ],
    submitEmail: 'Send via email',
    submitPartners: 'View partner list ->',
    modalTitle: 'Vacancy Details',
    summary: 'Role Summary',
    compensation: 'Compensation & Benefits',
    responsibilities: 'Main Responsibilities',
    qualifications: 'Qualifications & Requirements',
    education: 'Education',
    experience: 'Experience',
    skills: 'Skills',
    other: 'Other criteria',
    jobDetails: 'Job Details',
    jobType: 'Job Type',
    applyMethod: 'How to Apply',
    close: 'Close',
  },
  ar: {
    pageTag: 'الوظائف',
    pageTitle: 'بوابة الوظائف والتدريب CDC UIN Kediri',
    pageDesc:
      'استكشف أحدث الفرص، واعثر على الوظائف حسب الكلية/التخصص، وابنِ تعاونًا مع شركاء الصناعة.',
    latestCta: 'عرض أحدث الوظائف',
    submitCta: 'إرسال وظيفة',
    sectionCards: [
      {
        id: 'lowongan-terbaru',
        title: 'أحدث الوظائف',
        desc: 'مجموعة من أحدث إعلانات الوظائف والتدريب الواردة إلى CDC UIN Kediri.',
        badge: 'تحديث يومي',
      },
      {
        id: 'lowongan-fakultas-prodi',
        title: 'وظائف حسب الكلية/التخصص',
        desc: 'تصفية الفرص المناسبة للتخصص أو الاهتمام أو المسار الأكاديمي للخريجين.',
        badge: 'تصفية التخصص',
      },
      {
        id: 'lowongan-magang',
        title: 'فرص التدريب',
        desc: 'برامج تدريب/PKL مُنسّقة مع شركاء الصناعة للطلاب والخريجين الجدد.',
        badge: 'تدريب',
      },
      {
        id: 'perusahaan-mitra',
        title: 'الشركات الشريكة',
        desc: 'نبذة عن الشركات الشريكة وقائمة الوظائف النشطة من كل شريك.',
        badge: 'شريك',
      },
    ],
    cardChips: ['كتالوج', 'تصفية', 'إشعارات'],
    latestTag: 'أحدث الوظائف',
    latestTitle: 'أحدث الكتالوج والتفاصيل الكاملة',
    latestDesc: 'اضغط عرض التفاصيل لفتح تفاصيل الوظيفة.',
    tabs: {
      all: 'الكل',
      kerja: 'وظائف',
      magang: 'تدريب',
      pkl: 'PKL',
    },
    loadingText: 'جارٍ تحميل الوظائف...',
    emptyText: 'لا توجد وظائف في هذه الفئة حاليًا. يرجى المحاولة لاحقًا أو استخدام مرشح آخر.',
    typeLabels: {
      kerja: 'وظيفة',
      magang: 'تدريب',
      pkl: 'PKL',
    },
    deadline: 'الموعد النهائي',
    location: 'الموقع',
    mode: 'النمط',
    type: 'النوع',
    detail: 'عرض التفاصيل',
    submitTag: 'إرسال وظيفة',
    submitTitle: 'افتح فرصًا للخريجين والطلاب',
    submitDesc:
      'يمكن للشركات الشريكة إرسال تفاصيل الوظائف (الوصف، المؤهلات، الموقع، الموعد النهائي، وجهة اتصال الموارد البشرية) لنشرها في بوابة CDC UIN Kediri.',
    submitBullets: [
      'سيقوم فريق CDC بمراجعة الطلبات قبل النشر.',
      'دعم نشر متعدد القنوات (البريد الإلكتروني، واتساب، والملصقات الرقمية).',
      'خيار جدولة ندوة/جلسة شركة لبناء العلامة الوظيفية.',
    ],
    submitEmail: 'إرسال عبر البريد',
    submitPartners: 'عرض قائمة الشركاء ->',
    modalTitle: 'تفاصيل الوظيفة',
    summary: 'ملخص الدور',
    compensation: 'التعويضات والمزايا',
    responsibilities: 'المسؤوليات الرئيسية',
    qualifications: 'المؤهلات والمتطلبات',
    education: 'التعليم',
    experience: 'الخبرة',
    skills: 'المهارات',
    other: 'معايير أخرى',
    jobDetails: 'تفاصيل العمل',
    jobType: 'نوع الوظيفة',
    applyMethod: 'طريقة التقديم',
    close: 'إغلاق',
  },
}

const ui = computed(() => copyByLocale[locale.value] || copyByLocale.id)
const jobSections = computed(() => ui.value.sectionCards)
const typeLabels = computed(() => ui.value.typeLabels)

const filterType = ref('all')
const filterTabs = ['all', 'kerja', 'magang', 'pkl']
const filterTabContainerRef = ref(null)
const filterTabRefs = ref([])
const filterTabIndicator = ref({ left: 0, top: 0, width: 0, height: 0 })
const jobModalOpen = ref(false)
const selectedJobId = ref(null)

const mapLocalizedJob = (item, options = {}) => {
  const detailed = options?.detailed === true
  return {
    ...item,
    title: resolveLocalizedString(item, 'title'),
    company: resolveLocalizedString(item, 'company'),
    companyProfile: detailed ? resolveLocalizedString(item, 'companyProfile') : toText(readPath(item, 'companyProfile')),
    location: resolveLocalizedString(item, 'location'),
    workMode: resolveLocalizedString(item, 'workMode'),
    jobType: resolveLocalizedString(item, 'jobType'),
    summary: resolveLocalizedString(item, 'summary'),
    compensation: detailed ? resolveLocalizedString(item, 'compensation') : '',
    deadline: toText(readPath(item, 'deadline')),
    responsibilities: detailed ? resolveLocalizedArray(item, 'responsibilities') : [],
    benefits: detailed ? resolveLocalizedArray(item, 'benefits') : [],
    qualifications: {
      education: detailed ? resolveLocalizedString(item, 'qualifications.education') : '',
      experience: detailed ? resolveLocalizedString(item, 'qualifications.experience') : '',
      skills: detailed ? resolveLocalizedArray(item, 'qualifications.skills') : [],
      other: detailed ? resolveLocalizedArray(item, 'qualifications.other') : [],
    },
    apply: detailed ? resolveLocalizedString(item, 'apply') : '',
  }
}

const localizedJobs = computed(() => jobs.value.map((job) => mapLocalizedJob(job)))

const filteredJobs = computed(() => {
  if (!localizedJobs.value.length) return []
  return localizedJobs.value.filter((job) => filterType.value === 'all' || job.category === filterType.value)
})

const openJob = (job) => {
  selectedJobId.value = job?.id ?? null
  jobModalOpen.value = true
}

const closeJobModal = () => {
  jobModalOpen.value = false
  selectedJobId.value = null
}

const selectedJob = computed(() => {
  if (selectedJobId.value === null || selectedJobId.value === undefined) return null
  const raw = jobs.value.find((item) => String(item?.id) === String(selectedJobId.value))
  if (!raw) return null
  return mapLocalizedJob(raw, { detailed: true })
})

const setFilterTabRef = (el, index) => {
  if (el) filterTabRefs.value[index] = el
}

const updateFilterTabIndicator = () => {
  nextTick(() => {
    const index = filterTabs.indexOf(filterType.value)
    const tabEl = filterTabRefs.value[index]
    if (!filterTabContainerRef.value || !tabEl) return
    const containerRect = filterTabContainerRef.value.getBoundingClientRect()
    const tabRect = tabEl.getBoundingClientRect()
    filterTabIndicator.value = {
      left: tabRect.left - containerRect.left,
      top: tabRect.top - containerRect.top,
      width: tabRect.width,
      height: tabRect.height,
    }
  })
}

onMounted(() => {
  fetchJobs()
  updateFilterTabIndicator()
  window.addEventListener('resize', updateFilterTabIndicator)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateFilterTabIndicator)
})

watch(filterType, () => {
  updateFilterTabIndicator()
})
</script>

<template>
  <div class="public-page">
    <header class="public-hero-panel motion-card-sheen space-y-4 p-6 sm:p-8">
      <p class="public-kicker">{{ ui.pageTag }}</p>
      <h1 class="public-section-title">{{ ui.pageTitle }}</h1>
      <p class="public-section-subtitle">
        {{ ui.pageDesc }}
      </p>
      <div class="flex flex-wrap gap-3">
        <a
          href="#lowongan-terbaru"
          class="public-primary-button"
        >
          {{ ui.latestCta }}
        </a>
        <a
          href="#submit-lowongan"
          class="public-ghost-button"
        >
          {{ ui.submitCta }}
        </a>
      </div>
    </header>

    <div class="grid gap-5 md:grid-cols-2">
      <article
        v-for="(section, sectionIdx) in jobSections"
        :id="section.id === 'lowongan-terbaru' ? undefined : section.id"
        :key="section.id"
        class="public-elevated-card motion-card-sheen motion-delay-item p-5"
        :style="{ '--stagger-index': sectionIdx }"
      >
        <div class="flex items-center gap-3">
          <div class="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
            {{ section.badge }}
          </div>
          <div class="h-2 w-2 rounded-full bg-indigo-400" />
        </div>
        <h2 class="mt-3 text-xl font-semibold text-slate-900">{{ section.title }}</h2>
        <p class="mt-2 text-sm text-slate-600">{{ section.desc }}</p>
        <div class="mt-4 flex flex-wrap gap-2 text-[13px] text-slate-500">
          <span
            v-for="chip in ui.cardChips"
            :key="`${section.id}-${chip}`"
            class="public-soft-chip"
          >{{ chip }}</span>
        </div>
      </article>
    </div>

    <section
      id="lowongan-terbaru"
      class="public-elevated-card motion-card-sheen space-y-4 p-5"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="public-kicker">{{ ui.latestTag }}</p>
          <h2 class="text-xl font-semibold text-slate-900">{{ ui.latestTitle }}</h2>
          <p class="text-xs text-slate-500">{{ ui.latestDesc }}</p>
        </div>
        <p v-if="error" class="text-xs font-semibold text-rose-600">{{ error }}</p>
        <div
          ref="filterTabContainerRef"
          class="relative inline-flex rounded-full bg-slate-50 p-1 text-[11px] font-semibold text-slate-600"
        >
          <span
            aria-hidden="true"
            class="pointer-events-none absolute left-0 top-0 rounded-full bg-white shadow-sm ring-1 ring-slate-200 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            :style="{
              width: filterTabIndicator.width + 'px',
              height: filterTabIndicator.height + 'px',
              transform: `translate(${filterTabIndicator.left}px, ${filterTabIndicator.top}px)`,
              opacity: filterTabIndicator.width ? 0.95 : 0,
              filter: filterTabIndicator.width ? 'blur(0.4px)' : 'blur(0px)',
            }"
          ></span>
          <button
            type="button"
            :ref="(el) => setFilterTabRef(el, 0)"
            class="relative z-10 rounded-full px-3 py-1 transition-colors duration-200 ease-out"
            :class="filterType === 'all' ? 'text-slate-900' : 'text-slate-500 hover:bg-white/60 hover:text-slate-900'"
            @click="filterType = 'all'"
          >
            {{ ui.tabs.all }}
          </button>
          <button
            type="button"
            :ref="(el) => setFilterTabRef(el, 1)"
            class="relative z-10 rounded-full px-3 py-1 transition-colors duration-200 ease-out"
            :class="filterType === 'kerja' ? 'text-emerald-700' : 'text-slate-500 hover:bg-white/60 hover:text-slate-900'"
            @click="filterType = 'kerja'"
          >
            {{ ui.tabs.kerja }}
          </button>
          <button
            type="button"
            :ref="(el) => setFilterTabRef(el, 2)"
            class="relative z-10 rounded-full px-3 py-1 transition-colors duration-200 ease-out"
            :class="filterType === 'magang' ? 'text-indigo-700' : 'text-slate-500 hover:bg-white/60 hover:text-slate-900'"
            @click="filterType = 'magang'"
          >
            {{ ui.tabs.magang }}
          </button>
          <button
            type="button"
            :ref="(el) => setFilterTabRef(el, 3)"
            class="relative z-10 rounded-full px-3 py-1 transition-colors duration-200 ease-out"
            :class="filterType === 'pkl' ? 'text-amber-700' : 'text-slate-500 hover:bg-white/60 hover:text-slate-900'"
            @click="filterType = 'pkl'"
          >
            {{ ui.tabs.pkl }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">{{ ui.loadingText }}</div>
      <div v-else-if="!filteredJobs.length" class="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        {{ ui.emptyText }}
      </div>

      <div v-else class="grid gap-3">
        <article
          v-for="(job, jobIdx) in filteredJobs"
          :key="job.id"
          class="public-elevated-card motion-card-sheen motion-delay-item p-4"
          :style="{ '--stagger-index': jobIdx }"
        >
          <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
                  :class="{
                    'bg-emerald-50 text-emerald-700': job.category === 'kerja',
                    'bg-indigo-50 text-indigo-700': job.category === 'magang',
                    'bg-amber-50 text-amber-700': job.category === 'pkl',
                  }"
                >
                  {{ typeLabels[job.category] || ui.tabs.kerja }}
                </span>
                <span class="h-2 w-2 rounded-full bg-emerald-500" />
                <span class="text-xs font-semibold text-slate-600">{{ ui.deadline }}: {{ job.deadline || '-' }}</span>
              </div>
              <h3 class="text-lg font-semibold text-slate-900">{{ job.title }}</h3>
              <p class="text-sm font-semibold text-slate-700">{{ job.company }}</p>
              <p class="text-sm text-slate-600 line-clamp-2">{{ job.summary }}</p>
              <div class="flex flex-wrap gap-2 text-[12px] text-slate-600">
                <span class="rounded-full bg-white px-3 py-1">{{ ui.location }}: {{ job.location || '-' }}</span>
                <span class="rounded-full bg-white px-3 py-1">{{ ui.mode }}: {{ job.workMode || '-' }}</span>
                <span class="rounded-full bg-white px-3 py-1">{{ ui.type }}: {{ job.jobType || '-' }}</span>
              </div>
            </div>
            <button
              type="button"
              class="motion-underline-link inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
              @click="openJob(job)"
            >
              {{ ui.detail }}
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </article>
      </div>
    </section>

    <section
      id="submit-lowongan"
      class="public-hero-panel motion-card-sheen rounded-2xl p-[1px]"
    >
      <div class="h-full rounded-[18px] bg-white p-6 shadow-sm sm:p-8">
        <div class="grid gap-6 lg:grid-cols-3">
          <div class="lg:col-span-2 space-y-3">
            <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-700">{{ ui.submitTag }}</p>
            <h2 class="text-2xl font-semibold text-slate-900">{{ ui.submitTitle }}</h2>
            <p class="text-sm text-slate-700">
              {{ ui.submitDesc }}
            </p>
            <ul class="list-disc space-y-1 pl-4 text-sm text-slate-600">
              <li v-for="item in ui.submitBullets" :key="item">{{ item }}</li>
            </ul>
          </div>
          <div class="flex flex-col gap-3 lg:items-end lg:text-right">
            <a
              href="mailto:tracer@kampus.ac.id?subject=Submit%20Lowongan%20Mitra%20CDC%20UIN%20Kediri"
              class="public-primary-button motion-card-sheen"
            >
              {{ ui.submitEmail }}
            </a>
            <a href="#perusahaan-mitra" class="motion-underline-link text-sm font-semibold text-indigo-600 hover:text-indigo-500">
              {{ ui.submitPartners }}
            </a>
          </div>
        </div>
      </div>
    </section>

    <div
      v-if="jobModalOpen && selectedJob"
      class="public-dialog-backdrop"
      @click.self="closeJobModal"
    >
      <div class="public-dialog-panel max-w-4xl p-6 sm:p-8">
        <button
          type="button"
          class="public-dialog-close"
          @click="closeJobModal"
        >
          &times;
        </button>

        <div class="space-y-3">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">{{ ui.modalTitle }}</p>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-2xl font-semibold text-slate-900">{{ selectedJob.title }}</h3>
              <p class="text-sm font-semibold text-slate-700">{{ selectedJob.company }}</p>
              <p class="text-xs text-slate-500">{{ selectedJob.companyProfile }}</p>
            </div>
            <div class="flex gap-2 text-xs font-semibold text-slate-700">
              <span class="rounded-full bg-slate-100 px-3 py-1">{{ ui.location }}: {{ selectedJob.location }}</span>
              <span class="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">{{ ui.mode }}: {{ selectedJob.workMode }}</span>
              <span class="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">{{ selectedJob.jobType }}</span>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{{ ui.summary }}</p>
              <p class="mt-2 text-sm text-slate-700">{{ selectedJob.summary }}</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{{ ui.compensation }}</p>
              <p class="mt-2 text-sm font-semibold text-slate-800">{{ selectedJob.compensation }}</p>
              <ul
                v-if="selectedJob.benefits && selectedJob.benefits.length"
                class="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700"
              >
                <li v-for="benefit in selectedJob.benefits" :key="benefit">{{ benefit }}</li>
              </ul>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-100 bg-white p-4">
            <p class="text-sm font-semibold text-slate-900">{{ ui.responsibilities }}</p>
            <ul class="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700">
              <li v-for="item in selectedJob.responsibilities" :key="item">{{ item }}</li>
            </ul>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-2xl border border-slate-100 bg-white p-4">
              <p class="text-sm font-semibold text-slate-900">{{ ui.qualifications }}</p>
              <div class="mt-2 space-y-2 text-sm text-slate-700">
                <div>
                  <p class="font-semibold text-slate-800">{{ ui.education }}</p>
                  <p>{{ selectedJob.qualifications?.education }}</p>
                </div>
                <div>
                  <p class="font-semibold text-slate-800">{{ ui.experience }}</p>
                  <p>{{ selectedJob.qualifications?.experience }}</p>
                </div>
                <div>
                  <p class="font-semibold text-slate-800">{{ ui.skills }}</p>
                  <ul class="mt-1 list-disc space-y-1 pl-4">
                    <li v-for="skill in selectedJob.qualifications?.skills" :key="skill">{{ skill }}</li>
                  </ul>
                </div>
                <div v-if="selectedJob.qualifications?.other && selectedJob.qualifications.other.length">
                  <p class="font-semibold text-slate-800">{{ ui.other }}</p>
                  <ul class="mt-1 list-disc space-y-1 pl-4">
                    <li v-for="other in selectedJob.qualifications.other" :key="other">{{ other }}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-100 bg-white p-4">
              <p class="text-sm font-semibold text-slate-900">{{ ui.jobDetails }}</p>
              <div class="mt-2 space-y-2 text-sm text-slate-700">
                <p><span class="font-semibold text-slate-800">{{ ui.location }}:</span> {{ selectedJob.location }} ({{ selectedJob.workMode }})</p>
                <p><span class="font-semibold text-slate-800">{{ ui.jobType }}:</span> {{ selectedJob.jobType }}</p>
                <p><span class="font-semibold text-slate-800">{{ ui.deadline }}:</span> {{ selectedJob.deadline }}</p>
                <p><span class="font-semibold text-slate-800">{{ ui.applyMethod }}:</span> {{ selectedJob.apply }}</p>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              @click="closeJobModal"
            >
              {{ ui.close }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

