<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useCtaSlides } from '../stores/cta'
import { useSubmissions } from '../stores/submissions'
import { useJobs } from '../stores/jobs'
import { useNews } from '../stores/news'
import { useArticles } from '../stores/articles'

const { slides, fetchSlides } = useCtaSlides()

const heroSlides = computed(() => slides.value)
const fallbackHero = {
  tag: 'Career Development Center',
  title: 'Selamat Datang di Career Development Center',
  highlight: 'UIN Syekh Wasil Kediri',
  subtitle: 'Konten CTA dapat diatur melalui halaman admin.',
  chips: ['Tracer study', 'Portal CDC', 'Kemitraan industri'],
  primary: { label: 'Lihat layanan', to: '/layanan' },
  secondary: { label: 'Kembali ke portal', to: '/' },
  stats: {
    labelLeft: 'Program aktif',
    valueLeft: '-',
    labelRight: 'Mitra industri',
    valueRight: '-',
    progress: 0,
    remark: 'Update CTA di admin untuk menampilkan konten terbaru.',
    badge: 'Live',
  },
}
const activeHeroIndex = ref(0)
const activeHero = computed(() => {
  if (!heroSlides.value.length) return fallbackHero
  const index = Math.min(activeHeroIndex.value, heroSlides.value.length - 1)
  return heroSlides.value[index] || fallbackHero
})

watch(
  heroSlides,
  (items) => {
    if (!items.length) return
    if (activeHeroIndex.value >= items.length) {
      activeHeroIndex.value = 0
    }
  },
  { immediate: true },
)

const goNextHero = () => {
  if (!heroSlides.value.length) return
  activeHeroIndex.value = (activeHeroIndex.value + 1) % heroSlides.value.length
}
const goPrevHero = () => {
  if (!heroSlides.value.length) return
  activeHeroIndex.value =
    activeHeroIndex.value === 0 ? heroSlides.value.length - 1 : activeHeroIndex.value - 1
}
const goToHero = (index) => {
  if (index >= 0 && index < heroSlides.value.length) activeHeroIndex.value = index
}

const { latestAlumni } = useSubmissions()
const { jobs, fetchJobs } = useJobs()
const { news, fetchNews } = useNews()
const { articles, fetchArticles } = useArticles()

const defaultTracerStats = {
  employedPercent: '76%',
  waitTime: '2.8 bulan',
  salaryRange: 'Rp4,5 - 7,2 jt',
  topIndustry: 'Teknologi & Startup (34%)',
  industries: [
    { label: 'Teknologi & Startup', value: 34, colorFrom: 'from-indigo-500', colorTo: 'to-sky-500' },
    { label: 'Pendidikan', value: 22, colorFrom: 'from-emerald-500', colorTo: 'to-teal-500' },
    { label: 'Keuangan', value: 18, colorFrom: 'from-amber-400', colorTo: 'to-orange-400' },
    { label: 'Pemerintahan/LSM', value: 12, colorFrom: 'from-slate-500', colorTo: 'to-slate-600' },
    { label: 'Lainnya', value: 14, colorFrom: 'from-fuchsia-500', colorTo: 'to-purple-500' },
  ],
}

const defaultTopIndustryLabel = 'Teknologi & Startup'

const parseMonths = (value) => {
  if (value === null || value === undefined) return null
  const num = Number(String(value).replace(',', '.'))
  if (!Number.isFinite(num) || num <= 0) return null
  return num
}

const formatMonths = (months) => {
  if (months === null) return null
  const rounded = Number.isInteger(months) ? months.toString() : months.toFixed(1).replace('.0', '')
  return `${rounded} bulan`
}

const normalizeSalary = (raw) => {
  if (!raw) return null
  const sanitized = String(raw).replace(/[^0-9.,-]/g, '')
  const parts = sanitized.split('-').map((part) => part.trim()).filter(Boolean)
  const formatPart = (part) => {
    if (!part) return null
    const numeric = Number(part.replace(',', '.'))
    if (!Number.isFinite(numeric)) return null
    if (numeric >= 1000000) {
      return `Rp${(numeric / 1000000).toFixed(numeric % 1000000 === 0 ? 0 : 1).replace('.', ',')} jt`
    }
    return `Rp${numeric.toLocaleString('id-ID')}`
  }

  if (parts.length === 2) {
    const left = formatPart(parts[0])
    const right = formatPart(parts[1])
    if (left && right) return `${left} - ${right}`
  }

  const single = formatPart(parts[0])
  return single || null
}

const liveTracerStats = computed(() => {
  const latest = latestAlumni.value
  if (!latest) return defaultTracerStats

  const status = (latest.status || '').toLowerCase()
  const isWorking = ['bekerja', 'wira'].some((keyword) => status.includes(keyword))
  const employedPercent = isWorking ? '100%' : defaultTracerStats.employedPercent

  const waitMonths = parseMonths(latest.waitMonths || latest.bekerja_bulanDapat || latest.bekerja_bulanTidak)
  const waitTime = formatMonths(waitMonths) || defaultTracerStats.waitTime

  const salaryRange = normalizeSalary(latest.salary || latest.bekerja_pendapatan) || defaultTracerStats.salaryRange

  const answeredIndustry =
    latest.industry ||
    latest.bekerja_jenisPerusahaan ||
    latest.wira_bidang ||
    latest.wira_jenisPerusahaan ||
    ''
  const industryLabel = answeredIndustry.trim() || defaultTopIndustryLabel

  const industries = defaultTracerStats.industries.map((sector, idx) =>
    idx === 0 ? { ...sector, label: industryLabel } : sector,
  )
  const topIndustry = `${industryLabel} (${industries[0].value}%)`

  return {
    employedPercent,
    waitTime,
    salaryRange,
    topIndustry,
    industries,
  }
})

const features = [
  { title: 'Pengumpulan Data Cepat', desc: 'Kirim kuisioner multi-channel dengan notifikasi otomatis.', badge: 'Realtime' },
  { title: 'Analitik dan Laporan', desc: 'Pantau tingkat respon, tren karier, dan persebaran alumni.', badge: 'Insight' },
  { title: 'Integrasi & Ekspor', desc: 'Ekspor ke CSV/Excel atau hubungkan ke BI tools favorit.', badge: 'Opsional' },
  { title: 'Keamanan Data', desc: 'Akses berbasis peran dan enkripsi untuk menjaga privasi.', badge: 'Keamanan' },
]

const jobUpdates = computed(() => jobs.value.slice(0, 4))

const jobModalOpen = ref(false)
const selectedJob = ref(null)

const openJob = (job) => {
  selectedJob.value = job
  jobModalOpen.value = true
}

const closeJobModal = () => {
  jobModalOpen.value = false
  selectedJob.value = null
}

const publishedNews = computed(() => news.value.filter((item) => item.published).slice(0, 3))
const newsModalOpen = ref(false)
const selectedNews = ref(null)

const formatNewsDate = (value) => {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch (e) {
    return value
  }
}

const openNews = (item) => {
  selectedNews.value = item
  newsModalOpen.value = true
}

const closeNewsModal = () => {
  newsModalOpen.value = false
  selectedNews.value = null
}

const publishedArticles = computed(() => articles.value.filter((item) => item.published))
const featuredArticles = computed(() => publishedArticles.value.slice(0, 4))
const articleModalOpen = ref(false)
const selectedArticle = ref(null)

const openArticle = (item) => {
  selectedArticle.value = item
  articleModalOpen.value = true
}

const closeArticleModal = () => {
  articleModalOpen.value = false
  selectedArticle.value = null
}

const testimonials = [
  {
    name: 'Alya Putri Ramadhani',
    role: 'Alumni Akuntansi 2022',
    quote:
      'Proses isi kuisioner CDC cepat dan jelas. Saya langsung dapat informasi lowongan sesuai minat dan dibantu review CV.',
    avatar:
      'https://ui-avatars.com/api/?name=Alya+Putri&background=6366f1&color=fff',
  },
  {
    name: 'Rama Hidayat',
    role: 'Alumni Teknik Informatika 2021',
    quote: 'Reminder otomatisnya memudahkan, dan tim CDC sigap saat saya tanya soal magang ke mitra industri.',
    avatar:
      'https://ui-avatars.com/api/?name=Rama+Hidayat&background=22d3ee&color=fff',
  },
  {
    name: 'Siti Maharani',
    role: 'Alumni Pendidikan Bahasa 2020',
    quote: 'Setelah isi kuisioner, saya dihubungi CDC untuk coaching karier. Saya jadi yakin saat melamar ke mitra kampus.',
    avatar:
      'https://ui-avatars.com/api/?name=Siti+Maharani&background=8b5cf6&color=fff',
  },
  {
    name: 'Arif Kurniawan',
    role: 'Alumni Manajemen 2019',
    quote: 'CDC membantu koneksi ke mitra industri. Lowongan yang saya terima relevan dan prosesnya transparan.',
    avatar:
      'https://ui-avatars.com/api/?name=Arif+Kurniawan&background=10b981&color=fff',
  },
  {
    name: 'Nadia Azzahra',
    role: 'Alumni Psikologi 2023',
    quote: 'Selesai isi kuisioner, saya dapat undangan webinar karier dan sesi coaching. Sangat suportif untuk fresh graduate.',
    avatar:
      'https://ui-avatars.com/api/?name=Nadia+Azzahra&background=f59e0b&color=fff',
  },
]

const activeTestimonialIndex = ref(0)
const activeTestimonial = computed(() => testimonials[activeTestimonialIndex.value] || testimonials[0])
let testimonialTimer = null

const stopTestimonialAuto = () => {
  if (testimonialTimer) {
    clearInterval(testimonialTimer)
    testimonialTimer = null
  }
}

const startTestimonialAuto = () => {
  stopTestimonialAuto()
  testimonialTimer = setInterval(() => {
    activeTestimonialIndex.value = (activeTestimonialIndex.value + 1) % testimonials.length
  }, 2000)
}

onMounted(() => {
  startTestimonialAuto()
  fetchSlides()
  fetchJobs()
  fetchNews()
  fetchArticles()
})

onBeforeUnmount(() => {
  stopTestimonialAuto()
})

</script>

<template>
  <div class="space-y-16">
    <section
      class="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 shadow-lg shadow-indigo-500/10 sm:p-10"
      aria-label="Hero slider"
    >
      <div class="pointer-events-none absolute inset-0 opacity-70">
        <div class="absolute -left-12 -top-12 h-64 w-64 rounded-full bg-sky-100 blur-3xl" />
        <div class="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-indigo-50 blur-3xl" />
      </div>
      <div class="relative grid items-center gap-8 lg:grid-cols-2">
        <div class="space-y-4">
          <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
            <span class="h-2 w-2 rounded-full bg-emerald-500" />
            {{ activeHero.tag }}
          </div>
          <div class="space-y-2">
            <h1 class="text-3xl font-semibold text-slate-900 sm:text-4xl">
              {{ activeHero.title }}
              <span class="bg-gradient-to-r from-indigo-500 to-sky-500 bg-clip-text text-transparent">
                {{ activeHero.highlight }}
              </span>
            </h1>
            <p class="text-base text-slate-600 sm:text-lg">
              {{ activeHero.subtitle }}
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <RouterLink
              :to="activeHero.primary.to"
              class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:brightness-110"
            >
              {{ activeHero.primary.label }}
            </RouterLink>
            <RouterLink
              :to="activeHero.secondary.to"
              class="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              {{ activeHero.secondary.label }}
            </RouterLink>
          </div>

          <div class="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
            <span
              v-for="chip in activeHero.chips"
              :key="chip"
              class="rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-slate-100"
            >
              {{ chip }}
            </span>
          </div>
        </div>

        <div class="relative">
          <div class="absolute inset-0 rounded-2xl bg-white/80 blur" />
          <div class="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/10">
            <div class="flex items-center justify-between text-sm font-semibold text-slate-700">
              <span>Respon masuk</span>
              <span
                class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
              >
                <span class="h-2 w-2 rounded-full bg-emerald-500" />
                {{ activeHero.stats.badge }}
              </span>
            </div>
            <div class="mt-3 space-y-2 text-xs font-semibold text-slate-500">
              <div class="flex items-center justify-between">
                <span>Target</span>
                <span>{{ activeHero.stats.progress }}%</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500"
                  :style="{ width: `${activeHero.stats.progress}%` }"
                />
              </div>
            </div>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <div class="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                <p class="text-xs font-semibold text-slate-500">{{ activeHero.stats.labelLeft }}</p>
                <p class="text-xl font-semibold text-slate-900">{{ activeHero.stats.valueLeft }}</p>
              </div>
              <div class="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                <p class="text-xs font-semibold text-slate-500">{{ activeHero.stats.labelRight }}</p>
                <p class="text-xl font-semibold text-slate-900">{{ activeHero.stats.valueRight }}</p>
              </div>
            </div>
            <div class="mt-3 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700">
              "{{ activeHero.stats.remark }}"
            </div>
          </div>
        </div>
      </div>

      <div class="relative mt-6 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            @click="goPrevHero"
            aria-label="Slide sebelumnya"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            @click="goNextHero"
            aria-label="Slide berikutnya"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-for="(slide, idx) in heroSlides"
            :key="slide.id"
            type="button"
            class="h-2 rounded-full transition"
            :class="idx === activeHeroIndex ? 'w-8 bg-slate-900' : 'w-2 bg-slate-300'"
            @click="goToHero(idx)"
            :aria-label="`Pilih slide ${idx + 1}`"
          />
        </div>
      </div>
    </section>

    <section class="space-y-8">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Layanan</p>
          <h2 class="mt-1 text-3xl font-semibold text-slate-900">Semua yang dibutuhkan tracer study</h2>
        </div>
        <RouterLink class="text-sm font-semibold text-indigo-600 hover:text-indigo-500" to="/kuisioner"
          >Mulai isi kuisioner -></RouterLink
         >
      </div>
      <div class="grid gap-5 md:grid-cols-2">
        <article
          v-for="feature in features"
          :key="feature.title"
          class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-400" />
            <div class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {{ feature.badge }}
            </div>
          </div>
          <h3 class="mt-3 text-xl font-semibold text-slate-900">{{ feature.title }}</h3>
          <p class="mt-2 text-sm text-slate-600">{{ feature.desc }}</p>
        </article>
      </div>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-indigo-50/40 to-sky-50 p-6 shadow-sm sm:p-8">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Statistik Tracer Study</p>
          <h2 class="text-3xl font-semibold text-slate-900">Dashboard mini</h2>
          <p class="text-sm text-slate-600">Ringkasan cepat respon tracer: pekerjaan, waktu tunggu, gaji, dan industri.</p>
        </div>
        <span class="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-emerald-600 ring-1 ring-emerald-100">Live update</span>
      </div>

      <div class="mt-5 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-inner">
            <p class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Persentase lulusan bekerja</p>
            <p class="mt-2 text-3xl font-semibold text-slate-900">{{ liveTracerStats.employedPercent }}</p>
            <p class="text-sm text-slate-600">Telah terserap dalam 12 bulan setelah lulus.</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-inner">
            <p class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Lama tunggu kerja</p>
            <p class="mt-2 text-3xl font-semibold text-slate-900">{{ liveTracerStats.waitTime }}</p>
            <p class="text-sm text-slate-600">Median waktu sampai pekerjaan pertama.</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-inner">
            <p class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Rentang gaji rata-rata</p>
            <p class="mt-2 text-3xl font-semibold text-slate-900">{{ liveTracerStats.salaryRange }}</p>
            <p class="text-sm text-slate-600">Gaji awal lulusan (P25 - P75).</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-inner">
            <p class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Industri utama</p>
            <p class="mt-2 text-lg font-semibold text-slate-900">{{ liveTracerStats.topIndustry }}</p>
            <p class="text-sm text-slate-600">Bidang yang paling banyak menyerap lulusan.</p>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-slate-900">Industri penyerap lulusan</p>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">Mini chart</span>
          </div>
          <div class="mt-4 space-y-3">
            <div
              v-for="sector in liveTracerStats.industries"
              :key="sector.label"
              class="space-y-1"
            >
              <div class="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>{{ sector.label }}</span>
                <span>{{ sector.value }}%</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-gradient-to-r"
                  :class="`${sector.colorFrom} ${sector.colorTo}`"
                  :style="{ width: `${sector.value}%` }"
                />
              </div>
            </div>
          </div>
          <div class="mt-4 grid grid-cols-4 gap-2 text-[11px] text-slate-600">
            <span class="flex items-center gap-1">
              <span class="h-2 w-2 rounded-full bg-indigo-500" />
              {{ liveTracerStats.industries[0]?.label || 'Teknologi' }}
            </span>
            <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-emerald-500" /> Pendidikan</span>
            <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-amber-400" /> Keuangan</span>
            <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-slate-500" /> Pemerintahan/LSM</span>
          </div>
        </div>
      </div>
    </section>

    <section class="space-y-8">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Job Update</p>
          <h2 class="text-3xl font-semibold text-slate-900">Lowongan Kerja Terbaru</h2>
          <p class="text-sm text-slate-600">Kurasi 5 lowongan terbaru untuk alumni dan mahasiswa.</p>
        </div>
        <RouterLink
          to="/lowongan#lowongan-terbaru"
          class="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Lihat Semua Lowongan
        </RouterLink>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <article
          v-for="(job, idx) in jobUpdates"
          :key="job.title"
          class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
          <div class="flex items-start justify-between">
            <div class="flex flex-col gap-1">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">#{{ (idx + 1).toString().padStart(2, '0') }}</p>
              <h3 class="text-lg font-semibold text-slate-900">{{ job.title }}</h3>
              <p class="text-sm font-semibold text-slate-700">{{ job.company }}</p>
            </div>
            <span class="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <div class="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <div class="flex items-center gap-2">
              <span class="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-700">Lok</span>
              <span>{{ job.location }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-xs font-semibold text-indigo-700">DL</span>
              <span>Deadline: {{ job.deadline }}</span>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-500 sm:col-span-2"
              @click="openJob(job)"
            >
              Lihat lengkap
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </article>
      </div>
    </section>

    <div
      v-if="jobModalOpen && selectedJob"
      class="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-4 sm:items-center"
      @click.self="closeJobModal"
    >
      <div
        class="relative w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
        style="max-height: 90vh"
      >
        <button
          type="button"
          class="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          @click="closeJobModal"
        >
          ✕
        </button>

        <div class="space-y-3">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">Rincian Lowongan</p>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-2xl font-semibold text-slate-900">{{ selectedJob.title }}</h3>
              <p class="text-sm font-semibold text-slate-700">{{ selectedJob.company }}</p>
              <p class="text-xs text-slate-500">{{ selectedJob.companyProfile }}</p>
            </div>
            <div class="flex gap-2 text-xs font-semibold text-slate-700">
              <span class="rounded-full bg-slate-100 px-3 py-1">Lokasi: {{ selectedJob.location }}</span>
              <span class="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">Mode: {{ selectedJob.workMode }}</span>
              <span class="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">{{ selectedJob.jobType }}</span>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Ringkasan Posisi</p>
              <p class="mt-2 text-sm text-slate-700">{{ selectedJob.summary }}</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Kompensasi & Benefit</p>
              <p class="mt-2 text-sm font-semibold text-slate-800">{{ selectedJob.compensation }}</p>
              <ul v-if="selectedJob.benefits && selectedJob.benefits.length" class="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700">
                <li v-for="benefit in selectedJob.benefits" :key="benefit">{{ benefit }}</li>
              </ul>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-100 bg-white p-4">
            <p class="text-sm font-semibold text-slate-900">Tanggung Jawab Utama</p>
            <ul class="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700">
              <li v-for="item in selectedJob.responsibilities" :key="item">{{ item }}</li>
            </ul>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-2xl border border-slate-100 bg-white p-4">
              <p class="text-sm font-semibold text-slate-900">Kualifikasi & Persyaratan</p>
              <div class="mt-2 space-y-2 text-sm text-slate-700">
                <div>
                  <p class="font-semibold text-slate-800">Pendidikan</p>
                  <p>{{ selectedJob.qualifications.education }}</p>
                </div>
                <div>
                  <p class="font-semibold text-slate-800">Pengalaman</p>
                  <p>{{ selectedJob.qualifications.experience }}</p>
                </div>
                <div>
                  <p class="font-semibold text-slate-800">Keterampilan</p>
                  <ul class="mt-1 list-disc space-y-1 pl-4">
                    <li v-for="skill in selectedJob.qualifications.skills" :key="skill">{{ skill }}</li>
                  </ul>
                </div>
                <div v-if="selectedJob.qualifications.other && selectedJob.qualifications.other.length">
                  <p class="font-semibold text-slate-800">Kriteria lain</p>
                  <ul class="mt-1 list-disc space-y-1 pl-4">
                    <li v-for="other in selectedJob.qualifications.other" :key="other">{{ other }}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-100 bg-white p-4">
              <p class="text-sm font-semibold text-slate-900">Detail Pekerjaan</p>
              <div class="mt-2 space-y-2 text-sm text-slate-700">
                <p><span class="font-semibold text-slate-800">Lokasi:</span> {{ selectedJob.location }} ({{ selectedJob.workMode }})</p>
                <p><span class="font-semibold text-slate-800">Jenis Pekerjaan:</span> {{ selectedJob.jobType }}</p>
                <p><span class="font-semibold text-slate-800">Deadline:</span> {{ selectedJob.deadline }}</p>
                <p><span class="font-semibold text-slate-800">Cara Melamar:</span> {{ selectedJob.apply }}</p>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              @click="closeJobModal"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>

    <section class="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-indigo-100 via-sky-100 to-cyan-100 p-[1px]">
      <div class="h-full rounded-[22px] bg-white p-8 shadow-sm lg:px-10">
        <div class="space-y-6">
          <div class="flex flex-col gap-2">
            <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-700">Mitra Industri</p>
            <h2 class="text-3xl font-semibold text-slate-900">Didukung berbagai sektor</h2>
            <p class="text-sm text-slate-700">
              Alumni dan tracer study terhubung dengan jaringan mitra dari perusahaan nasional hingga instansi pendidikan.
            </p>
          </div>
          <div class="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <div class="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-sm font-bold text-white">PN</div>
              <div>
                <p class="text-sm font-semibold text-slate-900">Perusahaan nasional</p>
                <p class="text-xs text-slate-600">Manufaktur, logistik, energi</p>
              </div>
            </div>
            <div class="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 text-sm font-bold text-white">BF</div>
              <div>
                <p class="text-sm font-semibold text-slate-900">Perbankan & keuangan</p>
                <p class="text-xs text-slate-600">Bank, fintech, asuransi</p>
              </div>
            </div>
            <div class="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-500 text-sm font-bold text-white">SD</div>
              <div>
                <p class="text-sm font-semibold text-slate-900">Startup digital</p>
                <p class="text-xs text-slate-600">Produk teknologi & SaaS</p>
              </div>
            </div>
            <div class="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-sm font-bold text-white">IP</div>
              <div>
                <p class="text-sm font-semibold text-slate-900">Instansi pemerintah</p>
                <p class="text-xs text-slate-600">Kementerian & lembaga</p>
              </div>
            </div>
            <div class="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-sm font-bold text-white">LP</div>
              <div>
                <p class="text-sm font-semibold text-slate-900">Lembaga pendidikan</p>
                <p class="text-xs text-slate-600">Sekolah, kampus, LKP</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="space-y-8">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Berita</p>
          <h2 class="mt-1 text-3xl font-semibold text-slate-900">Kabar terbaru tracer study</h2>
        </div>
        <RouterLink class="text-sm font-semibold text-indigo-600 hover:text-indigo-500" to="/berita">Ikuti pengumuman -></RouterLink>
      </div>
      <div v-if="!publishedNews.length" class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        Belum ada berita dipublikasikan. Tambahkan dari halaman admin untuk tampil di sini.
      </div>
      <div v-else class="grid gap-5 md:grid-cols-3">
        <article
          v-for="berita in publishedNews"
          :key="berita.id"
          class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{{ formatNewsDate(berita.createdAt) }}</p>
          <h3 class="mt-2 text-lg font-semibold text-slate-900">{{ berita.title }}</h3>
          <p class="mt-2 text-sm text-slate-600 line-clamp-3">{{ berita.summary }}</p>
          <button
            type="button"
            class="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            @click="openNews(berita)"
          >
            Baca selengkapnya ->
          </button>
        </article>
      </div>
    </section>

    <div
      v-if="newsModalOpen && selectedNews"
      class="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-4 sm:items-center"
      @click.self="closeNewsModal"
    >
      <div class="relative w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8" style="max-height: 90vh">
        <button
          type="button"
          class="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          @click="closeNewsModal"
        >
          ✕
        </button>
        <div class="space-y-3">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">Berita</p>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {{ formatNewsDate(selectedNews.createdAt) }}
              </p>
              <h3 class="text-2xl font-semibold text-slate-900">{{ selectedNews.title }}</h3>
            </div>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
              {{ selectedNews.published ? 'Dipublikasikan' : 'Draft' }}
            </span>
          </div>
          <div v-if="selectedNews.imageUrl" class="overflow-hidden rounded-2xl border border-slate-100">
            <img :src="selectedNews.imageUrl" :alt="selectedNews.title" class="h-64 w-full object-cover" loading="lazy" />
          </div>
          <p class="text-sm font-semibold text-slate-800">{{ selectedNews.summary }}</p>
          <div class="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
            {{ selectedNews.content || 'Tidak ada konten tambahan.' }}
          </div>
          <div class="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              @click="closeNewsModal"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>

    <section class="space-y-8">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Testimoni</p>
          <h2 class="text-3xl font-semibold text-slate-900">Suara alumni</h2>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-for="(t, idx) in testimonials"
            :key="t.name"
            type="button"
            class="h-2 rounded-full transition"
            :class="idx === activeTestimonialIndex ? 'w-8 bg-slate-900' : 'w-2 bg-slate-300'"
            @click="activeTestimonialIndex = idx"
            :aria-label="`Pilih testimoni ${idx + 1}`"
          />
        </div>
      </div>
      <div
        class="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-indigo-50/40 to-sky-50 p-5 shadow-sm sm:p-6"
        @mouseenter="stopTestimonialAuto"
        @mouseleave="startTestimonialAuto"
      >
        <div
          class="pointer-events-none absolute inset-0 opacity-60"
          :style="{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.1), transparent 35%), radial-gradient(circle at 80% 0%, rgba(14,165,233,0.12), transparent 30%), linear-gradient(135deg, rgba(148,163,184,0.08) 0%, rgba(255,255,255,0) 50%)',
          }"
        />
        <transition name="fade" mode="out-in">
          <article :key="activeTestimonial.name">
            <p class="text-sm text-slate-700">"{{ activeTestimonial.quote }}"</p>
            <div class="mt-4 flex items-center gap-3">
              <img
                v-if="activeTestimonial.avatar"
                :src="activeTestimonial.avatar"
                :alt="activeTestimonial.name"
                class="h-12 w-12 rounded-full border border-slate-100 object-cover"
                loading="lazy"
              />
              <div v-else class="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-sky-400" />
              <div>
                <p class="font-semibold text-slate-900">{{ activeTestimonial.name }}</p>
                <p class="text-sm text-slate-600">{{ activeTestimonial.role }}</p>
              </div>
            </div>
          </article>
        </transition>
      </div>
    </section>

    <section class="space-y-6">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Artikel & Tips Karier</p>
          <h2 class="text-3xl font-semibold text-slate-900">Baca panduan terbaru</h2>
          <p class="text-sm text-slate-600">3-5 artikel singkat untuk bantu persiapan karier dan lowongan.</p>
        </div>
        <RouterLink
          to="/artikel"
          class="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Lihat semua tips
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </RouterLink>
      </div>
      <div v-if="!featuredArticles.length" class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        Belum ada artikel dipublikasikan. Tambahkan dari halaman admin untuk tampil di sini.
      </div>
      <div v-else class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="article in featuredArticles"
          :key="article.id"
          class="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
          <div v-if="article.imageUrl" class="relative h-36 w-full overflow-hidden">
            <img
              :src="article.imageUrl"
              :alt="article.title"
              class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent" />
          </div>
          <div class="space-y-2 p-4">
            <h3 class="text-lg font-semibold text-slate-900 group-hover:text-indigo-600">{{ article.title }}</h3>
            <p class="text-sm text-slate-600 line-clamp-3">{{ article.summary }}</p>
            <button
              type="button"
              class="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
              @click="openArticle(article)"
            >
              Lihat rincian
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </article>
      </div>
    </section>

    <div
      v-if="articleModalOpen && selectedArticle"
      class="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-4 sm:items-center"
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
