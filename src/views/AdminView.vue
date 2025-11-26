<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSubmissions } from '../stores/submissions'
import { useDashboardData } from '../stores/dashboard'
import { useAuth } from '../stores/auth'
import { useAlumni } from '../stores/alumni'

const { submissions } = useSubmissions()
const { dashboard, fetchDashboardData } = useDashboardData()
const auth = useAuth()
const { alumni, fetchAlumni } = useAlumni()
const router = useRouter()

onMounted(() => {
  fetchDashboardData()
  fetchAlumni()
})

const adminNav = [
  { label: 'Ikhtisar', target: 'overview', icon: 'overview' },
  { label: 'Kelola kuisioner', route: '/admin/kuisioner', icon: 'kuisioner' },
  { label: 'Daftar alumni', route: '/admin/alumni', icon: 'alumni' },
  { label: 'Bank soal', route: '/admin/bank-soal', icon: 'bank' },
  { label: 'CTA Slider', route: '/admin/cta', icon: 'cta' },
  { label: 'Kelola lowongan', route: '/admin/lowongan', icon: 'lowongan' },
  { label: 'Artikel & tips', route: '/admin/artikel', icon: 'artikel' },
  { label: 'User', route: '/admin/user', icon: 'user' },
  { label: 'Berita', route: '/admin/berita', icon: 'berita' },
]
const quickShortcuts = computed(() => [])

const defaultAdminProfile = {
  name: 'Rita Rahmania',
  role: 'Koordinator CDC',
  email: 'admin@tracer.local',
  avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=240&q=60',
}

const adminProfile = computed(() => {
  const user = auth.user.value || {}
  return {
    name: user.fullName || user.name || defaultAdminProfile.name,
    role: user.role || defaultAdminProfile.role,
    email: user.email || defaultAdminProfile.email,
    avatar: user.avatar || defaultAdminProfile.avatar,
  }
})

const activeSection = ref('overview')

const defaultHeroChips = ['Email kampus', 'Portal alumni', 'Integrasi SIAKAD']

const defaultTracerRows = [
  { nama: 'Siti Rahma', prodi: 'Informatika', angkatan: '2019', status: 'Bekerja', waktu: '3 bln', gaji: '7 jt' },
  { nama: 'Andi Pratama', prodi: 'Manajemen', angkatan: '2018', status: 'Wirausaha', waktu: '2 bln', gaji: '10 jt' },
  { nama: 'Bima Utama', prodi: 'Hukum', angkatan: '2020', status: 'Melanjutkan studi', waktu: '-', gaji: '-' },
  { nama: 'Citra Dewi', prodi: 'Akuntansi', angkatan: '2019', status: 'Bekerja', waktu: '1 bln', gaji: '8 jt' },
  { nama: 'Danu Saputra', prodi: 'Teknik Sipil', angkatan: '2018', status: 'Bekerja', waktu: '4 bln', gaji: '9 jt' },
]

const defaultFollowUpTasks = [
  { title: 'Reminder angkatan 2021', channel: 'WA Blast', due: 'Besok, 09.00', status: 'Terjadwal' },
  { title: 'Validasi email bounce', channel: 'Email', due: 'Hari ini, 15.00', status: 'Butuh data' },
  { title: 'Review pertanyaan karier', channel: 'Portal', due: 'Jumat, 10.00', status: 'Selesai' },
]

const defaultChannelPerformance = [
  { label: 'Email kampus', completion: 74, trend: '+6%', color: 'from-teal-500 to-emerald-400' },
  { label: 'WhatsApp blast', completion: 82, trend: '+12%', color: 'from-emerald-500 to-lime-400' },
  { label: 'Portal alumni', completion: 58, trend: '-2%', color: 'from-cyan-500 to-blue-500' },
]

const defaultCohortProgress = [
  { cohort: '2019', completion: 78, total: 420 },
  { cohort: '2020', completion: 65, total: 398 },
  { cohort: '2021', completion: 54, total: 512 },
]

const defaultJobDistribution = [
  { label: 'Bekerja', percent: 68, color: 'bg-emerald-500' },
  { label: 'Wirausaha', percent: 12, color: 'bg-amber-500' },
  { label: 'Melanjutkan studi', percent: 9, color: 'bg-indigo-500' },
  { label: 'Mencari kerja', percent: 11, color: 'bg-rose-500' },
]

const defaultBaseActivity = [
  { title: 'Sinkron SIAKAD selesai', detail: 'Data lulusan 2024 diperbarui', time: 'Hari ini 09.00', icon: 'IT' },
  { title: 'Tim prodi Teknik login', detail: 'Update status tracer', time: 'Kemarin 16.20', icon: 'TK' },
  { title: 'Reminder WhatsApp batch 2', detail: 'Terkirim ke 380 alumni', time: 'Kemarin 14.05', icon: 'WA' },
]

const statusClasses = {
  Bekerja: 'bg-emerald-50 text-emerald-600',
  Wirausaha: 'bg-amber-50 text-amber-600',
  'Melanjutkan studi': 'bg-indigo-50 text-indigo-600',
  'Mencari kerja': 'bg-rose-50 text-rose-600',
  'Belum bekerja': 'bg-slate-100 text-slate-600',
  'Pengguna alumni': 'bg-slate-100 text-slate-600',
}

const taskStatusClasses = {
  Terjadwal: 'bg-emerald-50 text-emerald-600',
  'Butuh data': 'bg-amber-50 text-amber-600',
  Selesai: 'bg-slate-100 text-slate-600',
}

const statusLabelMap = {
  bekerja: 'Bekerja',
  wirausaha: 'Wirausaha',
  melanjutkan: 'Melanjutkan studi',
  mencari: 'Mencari kerja',
  belum: 'Belum bekerja',
  pengguna: 'Pengguna alumni',
  'pengguna_alumni': 'Pengguna alumni',
}

const formatStatusLabel = (status) => {
  const key = String(status || '').toLowerCase().trim()
  return statusLabelMap[key] || status || 'Menunggu verifikasi'
}

const formatSalary = (val) => {
  if (val == null || val === '') return '-'
  const num = Number(val)
  if (Number.isFinite(num)) {
    const jt = num > 1000 ? num / 1_000_000 : num
    return `Rp ${jt.toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`
  }
  return String(val)
}

const formatWait = (val) => {
  if (val == null || val === '') return '-'
  return `${val} bln`
}

const heroChips = computed(() =>
  dashboard.payload.heroChips?.length ? dashboard.payload.heroChips : defaultHeroChips,
)

const submissionItems = computed(() => submissions.items || [])
const alumniResponses = computed(() =>
  submissionItems.value.filter((item) => (item.type || '').toLowerCase() === 'alumni'),
)
const penggunaResponses = computed(() =>
  submissionItems.value.filter((item) => (item.type || '').toLowerCase() === 'pengguna_alumni'),
)
const alumniCount = computed(() => alumni.value.items?.length || 0)
const totalResponses = computed(() => submissionItems.value.length || 0)
const responseRate = computed(() => {
  if (!alumniCount.value) return 0
  return Math.min(100, (alumniResponses.value.length / alumniCount.value) * 100)
})

const referenceRows = computed(() =>
  dashboard.payload.referenceRows?.length ? dashboard.payload.referenceRows : defaultTracerRows,
)

const followUpTasks = computed(() =>
  dashboard.payload.followUpTasks?.length ? dashboard.payload.followUpTasks : defaultFollowUpTasks,
)

const channelPerformance = computed(() =>
  dashboard.payload.channelPerformance?.length ? dashboard.payload.channelPerformance : defaultChannelPerformance,
)

const jobDistribution = computed(() => {
  if (!alumniResponses.value.length) {
    return dashboard.payload.jobDistribution?.length ? dashboard.payload.jobDistribution : defaultJobDistribution
  }
  const statusKeys = [
    { key: 'bekerja', label: 'Bekerja', color: 'bg-emerald-500' },
    { key: 'wiraswasta', label: 'Wirausaha', color: 'bg-amber-500' },
    { key: 'melanjutkan', label: 'Melanjutkan studi', color: 'bg-indigo-500' },
    { key: 'mencari', label: 'Mencari kerja', color: 'bg-rose-500' },
    { key: 'belum', label: 'Belum bekerja', color: 'bg-slate-400' },
  ]
  const total = Math.max(1, alumniResponses.value.length)
  const dist = statusKeys
    .map((item) => {
      const count = alumniResponses.value.filter(
        (resp) => (resp.status || 'belum').toLowerCase() === item.key,
      ).length
      return { label: item.label, percent: Math.round((count / total) * 100), color: item.color }
    })
    .filter((item) => item.percent > 0)
  return dist.length ? dist : defaultJobDistribution
})

const baseActivity = computed(() =>
  dashboard.payload.baseActivity?.length ? dashboard.payload.baseActivity : defaultBaseActivity,
)

const cohortProgress = computed(() => {
  const alumniItems = alumni.value.items || []
  if (!alumniItems.length) {
    return dashboard.payload.cohortProgress?.length ? dashboard.payload.cohortProgress : defaultCohortProgress
  }
  const totalByYear = alumniItems.reduce((acc, item) => {
    const year = item.tahunLulus || item.tahun || 'Lainnya'
    acc[year] = (acc[year] || 0) + 1
    return acc
  }, {})
  const respondedByYear = alumniResponses.value.reduce((acc, item) => {
    const year = item.tahun || item.tahunLulus || 'Lainnya'
    acc[year] = (acc[year] || 0) + 1
    return acc
  }, {})
  const rows = Object.keys(totalByYear).map((year) => {
    const total = totalByYear[year] || 1
    const done = respondedByYear[year] || 0
    return {
      cohort: year,
      completion: Math.min(100, Math.round((done / total) * 100)),
      total,
    }
  })
  return rows.sort((a, b) => Number(b.cohort) - Number(a.cohort)).slice(0, 6)
})

const summaryCardExtras = computed(() => dashboard.payload.summaryCards || [])

const summaryCards = computed(() => [
  {
    label: 'Respon alumni',
    value: alumniResponses.value.length.toLocaleString('id-ID'),
    delta: `${responseRate.value.toFixed(1)}% dari ${alumniCount.value.toLocaleString('id-ID')} alumni`,
    accent: 'from-teal-500 to-emerald-400',
    icon: 'AL',
  },
  {
    label: 'Respon pengguna',
    value: penggunaResponses.value.length.toLocaleString('id-ID'),
    delta: 'Perusahaan/instansi',
    accent: 'from-cyan-500 to-sky-500',
    icon: 'PG',
  },
  {
    label: 'Alumni terdaftar',
    value: alumniCount.value.toLocaleString('id-ID'),
    delta: `${totalResponses.value.toLocaleString('id-ID')} total respon`,
    accent: 'from-emerald-500 to-lime-400',
    icon: 'DB',
  },
  {
    label: 'Response rate',
    value: `${responseRate.value.toFixed(1)}%`,
    delta: `Target 70% | ${alumniCount.value} alumni`,
    accent: 'from-indigo-500 to-purple-500',
    icon: 'RR',
  },
  ...summaryCardExtras.value,
])

const heroHighlights = computed(() => [
  {
    label: 'Total respon',
    value: totalResponses.value.toLocaleString('id-ID'),
    detail: `${alumniResponses.value.length} alumni, ${penggunaResponses.value.length} pengguna`,
  },
  {
    label: 'Completion rate',
    value: `${responseRate.value.toFixed(1)}%`,
    detail: `${alumniCount.value} alumni terdaftar`,
  },
])

const mapSubmissionRow = (item) => {
  if (item.type === 'pengguna_alumni') {
    return {
      nama: item.organisasi || 'Pengguna alumni',
      prodi: item.peran || item.bidang || '-',
      angkatan: item.lokasi || '-',
      status: 'Pengguna alumni',
      waktu: item.waktu || '-',
      gaji: '-',
    }
  }

  return {
    nama: item.nama || 'Alumni',
    prodi: item.prodi || '-',
    angkatan: item.tahun || '-',
    status: formatStatusLabel(item.status),
    waktu: formatWait(item.waitMonths || item.waktu),
    gaji: formatSalary(item.salary || item.gaji),
  }
}

const combinedRows = computed(() => {
  const manual = submissions.items.map(mapSubmissionRow)
  if (manual.length) return manual
  return referenceRows.value
})

const tableRows = computed(() => combinedRows.value.slice(0, 7))

const formatActivityTime = (iso) => {
  if (!iso) return 'Baru saja'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Baru saja'
  return date.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
}

const initials = (name = '') => {
  if (!name) return 'AL'
  const trimmed = name.trim()
  if (!trimmed) return 'AL'
  const parts = trimmed.split(' ')
  const first = parts[0]?.[0] || ''
  const last = parts[parts.length - 1]?.[0] || ''
  return (first + (last || '')).toUpperCase()
}

const activityFeed = computed(() => {
  const dynamic = submissions.items.slice(0, 4).map((item) => {
    if (item.type === 'pengguna_alumni') {
      const orgName = item.organisasi || 'Pengguna alumni'
      return {
        title: `${orgName} mengirim penilaian`,
        detail: `${item.peran || item.bidang || 'Peran belum diisi'} / ${item.lokasi || 'Lokasi belum diisi'}`,
        time: formatActivityTime(item.createdAt),
        icon: initials(orgName),
      }
    }

    return {
      title: `${item.nama || 'Alumni'} menyelesaikan kuisioner`,
      detail: `${item.prodi || 'Prodi belum diisi'} / ${item.status || 'Belum memilih status'}`,
      time: formatActivityTime(item.createdAt),
      icon: initials(item.nama),
    }
  })
  return [...dynamic, ...baseActivity.value].slice(0, 6)
})

const getStatusClass = (status) => statusClasses[status] || 'bg-slate-100 text-slate-600'
const getTaskStatusClass = (status) => taskStatusClasses[status] || 'bg-slate-100 text-slate-600'
const handleLogout = () => {
  auth.logout()
  router.push('/login')
}

const lastSynced = computed(() => {
  if (!dashboard.lastFetched) {
    return 'Belum ada sinkronisasi'
  }
  return new Date(dashboard.lastFetched).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
})

const NAV_STATE_KEY = 'admin-nav-collapsed'
const getStoredNavState = () => {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(NAV_STATE_KEY) === 'true'
}
const persistNavState = (value) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(NAV_STATE_KEY, String(value))
}

const isNavCollapsed = ref(getStoredNavState())
const toggleNav = () => {
  isNavCollapsed.value = !isNavCollapsed.value
  persistNavState(isNavCollapsed.value)
}

const scrollToSection = (target) => {
  activeSection.value = target
  const el = document.getElementById(target)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const isNavItemActive = (item) => {
  if (item.route) {
    return router.currentRoute.value.path === item.route
  }
  return activeSection.value === item.target
}

const handleNavClick = (item) => {
  if (item.route) {
    router.push(item.route)
    return
  }
  if (item.target) {
    scrollToSection(item.target)
  }
}

const iconPaths = {
  overview: [
    'M4 4h7v7H4z',
    'M13 4h7v5h-7z',
    'M4 13h5v7H4z',
    'M11 13h9v7h-9z',
  ],
  kuisioner: [
    'M7 4h10a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    'M9 8h8',
    'M9 11h8',
    'M9 14h6',
    'M5 8h1',
    'M5 11h1',
    'M5 14h1',
  ],
  alumni: [
    'M12 13c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z',
    'M5 19c0-3.31 3.13-5 7-5s7 1.69 7 5v1H5z',
  ],
  bank: [
    'M4 8h16',
    'M4 12h16',
    'M4 16h16',
    'M7 4h10l1 2H6z',
  ],
  cta: [
    'M5 11h14l-3 3',
    'M5 13h14l-3-3',
    'M5 7h14',
  ],
  lowongan: [
    'M7 8V6a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v2',
    'M5 8h14v11H5z',
    'M9 12h6',
    'M9 15h4',
  ],
  artikel: [
    'M6 4h12v16H6z',
    'M9 8h6',
    'M9 11h6',
    'M9 14h4',
  ],
  user: [
    'M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z',
    'M5 20a7 7 0 0 1 14 0',
  ],
  kpi: [
    'M5 11h3v9H5z',
    'M10.5 7h3v13h-3z',
    'M16 4h3v16h-3z',
  ],
  progress: [
    'M4 18 10 8l4 6 4-8',
    'M4 18h16',
    'M10 8h4',
  ],
  insight: [
    'M12 4a4 4 0 0 1 4 4c0 3-3 5-4 8-1-3-4-5-4-8a4 4 0 0 1 4-4z',
    'M12 20v-2',
    'M9 20h6',
  ],
  activity: [
    'M12 6v6l3 3',
    'M12 3a9 9 0 1 1-9 9 9 9 0 0 1 9-9z',
  ],
  tasks: [
    'M7 7l2 2 4-4',
    'M7 13l2 2 4-4',
    'M5 5h2',
    'M5 11h2',
    'M5 17h2',
  ],
  berita: [
    'M6 4h12v16H6z',
    'M9 7h9',
    'M9 11h9',
    'M9 15h6',
  ],
}

const renderIcon = (name) => iconPaths[name] || iconPaths.overview
</script>

<template>
  <div class="relative flex min-h-screen bg-slate-100 text-slate-900">
    <div
      v-if="isNavCollapsed"
      class="fixed left-3 top-4 bottom-6 z-30 flex w-20 flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-[0_20px_60px_-25px_rgba(15,118,110,0.25)]"
    >
      <button
        type="button"
        class="flex h-9 w-9 items-center justify-center rounded-full border border-teal-100 bg-white text-xs font-semibold text-slate-700 shadow-sm transition hover:scale-105"
        @click="toggleNav"
        aria-label="Tampilkan menu"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </svg>
      </button>
      <p class="text-[10px] font-semibold text-slate-700 text-center leading-tight px-1">
        Dashboard<br />CDC UIN<br />Syekh Wasil<br />Kediri
      </p>
      <img
        :src="adminProfile.avatar"
        alt="Admin avatar"
        class="h-10 w-10 rounded-2xl object-cover shadow border border-slate-200"
      />
      <div class="h-px w-full bg-slate-200/80" />
      <div
        class="flex flex-1 flex-col items-center gap-2 overflow-y-auto pb-1 pr-1"
        style="scrollbar-width: thin; scrollbar-color: rgba(51,65,85,0.1) transparent;"
      >
        <button
          v-for="item in adminNav"
          :key="`mini-${item.route || item.target}`"
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-xl border text-slate-500 transition"
          :class="isNavItemActive(item) ? 'border-teal-200 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white hover:border-slate-300 hover:text-slate-700'"
          :title="item.label"
          @click.prevent="handleNavClick(item)"
        >
          <svg
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path v-for="(d, idx) in renderIcon(item.icon)" :key="`mini-${item.icon}-${idx}`" :d="d" />
          </svg>
        </button>
      </div>
    </div>
    <aside
      class="hidden flex-shrink-0 flex-col border-r border-white/50 bg-gradient-to-b from-white/70 via-white/40 to-white/70 px-6 py-8 shadow-[0_25px_80px_-30px_rgba(15,118,110,0.45)] backdrop-blur-xl transition-all duration-300 lg:flex"
      :class="isNavCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-80 opacity-100'"
    >
      <div class="mb-4 flex items-center justify-end">
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-full border border-teal-100 bg-white/90 text-sm font-semibold text-slate-700 shadow-lg shadow-emerald-500/20 transition hover:scale-105 hover:bg-white"
          @click="toggleNav"
          aria-label="Sembunyikan menu"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 6l12 12" />
            <path d="M6 18L18 6" />
          </svg>
        </button>
      </div>

      <div class="relative rounded-3xl bg-gradient-to-br from-teal-600 to-cyan-500 p-5 text-white shadow-lg shadow-teal-500/30">
        <button
          type="button"
        class="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
        @click="router.push('/admin/profile')"
        aria-label="Pengaturan profil admin"
      >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 3v2" />
            <path d="M12 19v2" />
            <path d="M5.22 5.22l1.42 1.42" />
            <path d="M17.36 17.36l1.42 1.42" />
            <path d="M3 12h2" />
            <path d="M19 12h2" />
            <path d="M5.22 18.78l1.42-1.42" />
            <path d="M17.36 6.64l1.42-1.42" />
          </svg>
        </button>
        <div class="flex items-center gap-4">
          <img :src="adminProfile.avatar" alt="Admin avatar" class="h-14 w-14 rounded-2xl object-cover shadow-lg shadow-black/20" />
          <div>
            <p class="text-sm font-semibold">{{ adminProfile.name }}</p>
            <p class="text-xs text-white/80">{{ adminProfile.role }}</p>
            <p class="mt-1 text-[11px] text-white/70">{{ adminProfile.email }}</p>
          </div>
        </div>
        <div class="mt-5 flex items-center justify-between text-[11px] text-white/70">
          <span>Status sinkron</span>
          <span class="font-semibold text-white">{{ lastSynced }}</span>
        </div>
      </div>

      <nav class="mt-8 space-y-1 text-sm font-semibold text-slate-500">
        <button
          v-for="item in adminNav"
          :key="item.route || item.target"
          class="flex w-full items-center gap-3 rounded-2xl px-3 py-2 transition"
          :class="
            isNavItemActive(item)
              ? 'border border-teal-100 bg-teal-50 text-teal-700 shadow-sm'
              : 'hover:bg-slate-50 hover:text-slate-700'
          "
          @click.prevent="handleNavClick(item)"
        >
          <svg
            class="h-4 w-4 flex-shrink-0"
            :class="isNavItemActive(item) ? 'text-teal-600' : 'text-slate-400'"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path v-for="(d, idx) in renderIcon(item.icon)" :key="`${item.icon}-${idx}`" :d="d" />
          </svg>
          {{ item.label }}
        </button>
      </nav>

      <div class="mt-auto space-y-4">
        <div class="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-xs text-slate-500">
          <p class="font-semibold text-slate-900">Catatan</p>
          <p>Status data: {{ dashboard.loading ? 'Memuat...' : 'Sinkron' }}</p>
        </div>
        <button
          class="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
          @click="handleLogout"
        >
          Logout
        </button>
      </div>
    </aside>

    <div class="flex-1 overflow-hidden">
      <div class="border-b border-slate-100 bg-white px-4 py-3 shadow-sm lg:hidden">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <img :src="adminProfile.avatar" alt="Admin avatar" class="h-10 w-10 rounded-2xl object-cover" />
            <div>
              <p class="text-sm font-semibold text-slate-900">{{ adminProfile.name }}</p>
              <p class="text-xs text-slate-500">{{ adminProfile.role }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              @click="router.push('/admin/profile')"
              aria-label="Pengaturan profil admin"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 3v2" />
                <path d="M12 19v2" />
                <path d="M5.22 5.22l1.42 1.42" />
                <path d="M17.36 17.36l1.42 1.42" />
                <path d="M3 12h2" />
                <path d="M19 12h2" />
                <path d="M5.22 18.78l1.42-1.42" />
                <path d="M17.36 6.64l1.42-1.42" />
              </svg>
            </button>
            <button
              class="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold text-slate-700"
              @click="handleLogout"
            >
              Logout
            </button>
          </div>
        </div>
        <div class="mt-3 flex gap-2 overflow-x-auto text-xs font-semibold text-slate-500">
          <button
            v-for="item in adminNav"
            :key="`mobile-${item.route || item.target}`"
            class="rounded-full border border-slate-200 px-3 py-1"
            :class="isNavItemActive(item) ? 'bg-slate-900 text-white border-slate-900' : ''"
            @click.prevent="handleNavClick(item)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <main
        class="max-h-screen overflow-y-auto bg-slate-50/60 pl-4 sm:pl-6"
        style="scrollbar-width: thin; scrollbar-color: rgba(51,65,85,0.1) transparent;"
      >
        <div
          class="space-y-10 px-4 py-6 sm:px-6 lg:px-10"
          :class="isNavCollapsed ? 'mx-auto max-w-7xl' : 'mx-auto max-w-6xl'"
        >
          <section id="overview" class="rounded-[32px] bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-500 p-6 text-white shadow-xl sm:p-8">
            <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div class="space-y-4">
                <p class="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">Tracer 2025</p>
                <h1 class="text-3xl font-semibold leading-tight text-white">Panel kendali tracer study</h1>
                <p class="text-sm text-white/80">
                  Monitor progres respon, kanal kampanye, dan outcome karier alumni secara real-time sesuai referensi Domiex teal.
                </p>
                <div class="flex flex-wrap gap-2 text-xs text-white/80">
                  <span v-for="chip in heroChips" :key="chip" class="rounded-full bg-white/15 px-3 py-1">
                    {{ chip }}
                  </span>
                </div>
                <div class="flex flex-wrap gap-3 text-sm font-semibold">
                  <button class="rounded-full bg-white/10 px-5 py-2 text-white shadow-inner shadow-black/20 transition hover:bg-white/20">
                    Tambah Kuisioner
                  </button>
                  <button class="rounded-full border border-white/40 px-5 py-2 text-white/90 transition hover:bg-white/10">
                    Ekspor ringkasan
                  </button>
                </div>
              </div>
              <div class="grid flex-1 gap-4 sm:grid-cols-2">
                <div
                  v-for="card in heroHighlights"
                  :key="card.label"
                  class="rounded-3xl border border-white/30 bg-white/10 p-4 text-white shadow-lg shadow-black/10 backdrop-blur"
                >
                  <p class="text-xs uppercase tracking-[0.3em] text-white/70">{{ card.label }}</p>
                  <p class="mt-3 text-3xl font-semibold">{{ card.value }}</p>
                  <p class="mt-1 text-xs text-white/80">{{ card.detail }}</p>
                </div>
              </div>
            </div>
          </section>

          <section id="kpi" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article
              v-for="card in summaryCards"
              :key="card.label"
              class="relative rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/70"
            >
              <div class="flex items-start justify-between">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{{ card.label }}</p>
                  <p class="mt-3 text-2xl font-semibold text-slate-900">{{ card.value }}</p>
                  <p class="mt-1 text-sm text-slate-500">{{ card.delta }}</p>
                </div>
                <span
                  class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-xs font-semibold text-white"
                  :class="card.accent"
                >
                  {{ card.icon }}
                </span>
              </div>
            </article>
          </section>

          <section id="progress" class="grid gap-6 xl:grid-cols-3">
            <div class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-200/60">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-lg font-semibold text-slate-900">Progress angkatan</h2>
                  <p class="text-sm text-slate-500">Pantau kelengkapan per cohort</p>
                </div>
                <button class="text-xs font-semibold text-teal-600 hover:text-teal-500">Lihat detail</button>
              </div>
              <div class="mt-5 space-y-5">
                <div v-for="cohort in cohortProgress" :key="cohort.cohort">
                  <div class="flex items-center justify-between text-sm text-slate-600">
                    <p class="font-semibold text-slate-900">Angkatan {{ cohort.cohort }}</p>
                    <p>{{ cohort.completion }}% / {{ cohort.total }} lulus</p>
                  </div>
                  <div class="mt-2 h-2 rounded-full bg-slate-100">
                    <div class="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400" :style="{ width: `${cohort.completion}%` }" />
                  </div>
                </div>
              </div>
              <div class="mt-6 rounded-2xl bg-slate-50 p-4">
                <p class="text-sm font-semibold text-slate-900">Sebaran karier</p>
                <ul class="mt-4 space-y-4 text-sm">
                  <li v-for="job in jobDistribution" :key="job.label">
                    <div class="flex items-center justify-between text-slate-600">
                      <p>{{ job.label }}</p>
                      <p class="font-semibold text-slate-900">{{ job.percent }}%</p>
                    </div>
                    <div class="mt-2 h-2 rounded-full bg-slate-200/80">
                      <div class="h-full rounded-full" :class="job.color" :style="{ width: `${job.percent}%` }" />
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div class="rounded-3xl border border-slate-100 bg-white p-0 shadow-sm shadow-slate-200/60 xl:col-span-2">
              <div class="flex flex-col gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 class="text-lg font-semibold text-slate-900">Ringkasan respon alumni</h2>
                  <p class="text-sm text-slate-500">Data terbaru ditambah dengan sampel referensi</p>
                </div>
                <div class="flex flex-wrap gap-2 text-xs">
                  <button class="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">
                    Semua status
                  </button>
                  <button class="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">
                    Ekspor XLSX
                  </button>
                </div>
              </div>
              <div class="overflow-x-auto p-4 sm:p-6">
                <table class="min-w-full text-left text-sm text-slate-700">
                  <thead class="text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th class="px-4 py-2 font-semibold">Nama</th>
                      <th class="px-4 py-2 font-semibold">Prodi</th>
                      <th class="px-4 py-2 font-semibold">Angkatan</th>
                      <th class="px-4 py-2 font-semibold">Status</th>
                      <th class="px-4 py-2 font-semibold">Waktu tunggu</th>
                      <th class="px-4 py-2 font-semibold">Gaji awal</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="row in tableRows" :key="row.nama + row.prodi + row.angkatan" class="transition hover:bg-slate-50">
                      <td class="px-4 py-3 font-semibold text-slate-900">{{ row.nama }}</td>
                      <td class="px-4 py-3">{{ row.prodi }}</td>
                      <td class="px-4 py-3">{{ row.angkatan }}</td>
                      <td class="px-4 py-3">
                        <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="getStatusClass(row.status)">{{ row.status }}</span>
                      </td>
                      <td class="px-4 py-3">{{ row.waktu }}</td>
                      <td class="px-4 py-3">{{ row.gaji }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section id="insight" class="grid gap-6 xl:grid-cols-3">
            <div class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-200/60">
              <h2 class="text-lg font-semibold text-slate-900">Performa kanal</h2>
              <p class="text-sm text-slate-500">Tracking tingkat buka & konversi</p>
              <div class="mt-5 space-y-5">
                <div
                  v-for="channel in channelPerformance"
                  :key="channel.label"
                  class="rounded-2xl border border-slate-100 p-4 shadow-inner shadow-slate-100/70"
                >
                  <div class="flex items-center justify-between text-sm text-slate-500">
                    <p class="font-semibold text-slate-900">{{ channel.label }}</p>
                    <span class="text-emerald-600">{{ channel.trend }}</span>
                  </div>
                  <div class="mt-3 h-3 rounded-full bg-slate-100">
                    <div class="h-full rounded-full bg-gradient-to-r" :class="channel.color" :style="{ width: `${channel.completion}%` }" />
                  </div>
                  <p class="mt-2 text-xs text-slate-500">Completion {{ channel.completion }}%</p>
                </div>
              </div>
            </div>

            <div id="activity" class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-200/60">
              <h2 class="text-lg font-semibold text-slate-900">Aktivitas terbaru</h2>
              <p class="text-sm text-slate-500">Momen penting 48 jam terakhir</p>
              <ul class="mt-5 space-y-4">
                <li
                  v-for="activity in activityFeed"
                  :key="activity.title + activity.time"
                  class="flex items-start gap-3 rounded-2xl border border-slate-100 p-4"
                >
                  <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-sm font-semibold text-white">
                    {{ activity.icon }}
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-semibold text-slate-900">{{ activity.title }}</p>
                    <p class="text-xs text-slate-500">{{ activity.detail }}</p>
                  </div>
                  <span class="text-xs font-semibold text-slate-500">{{ activity.time }}</span>
                </li>
              </ul>
            </div>

            <div id="tasks" class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-200/60">
              <h2 class="text-lg font-semibold text-slate-900">Tindak lanjut tim</h2>
              <p class="text-sm text-slate-500">Koordinasi dengan prodi & CDC</p>
              <ul class="mt-5 space-y-4">
                <li
                  v-for="task in followUpTasks"
                  :key="task.title"
                  class="flex items-start gap-3 rounded-2xl border border-slate-100 p-4"
                >
                  <div class="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">{{ task.channel }}</div>
                  <div class="flex-1">
                    <p class="text-sm font-semibold text-slate-900">{{ task.title }}</p>
                    <p class="text-xs text-slate-500">{{ task.due }}</p>
                  </div>
                  <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="getTaskStatusClass(task.status)">{{ task.status }}</span>
                </li>
              </ul>
              <button class="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Tambah tindak lanjut
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>
