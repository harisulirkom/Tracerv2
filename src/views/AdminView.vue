<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getTracerInsights } from '../services/dashboardService'
import tracerService from '../services/tracerService'
import { DASHBOARD_TIMEOUT_MS } from '../services/requestTimeout'
import { useSubmissions } from '../stores/submissions'
import { useQuestionnaires } from '../stores/questionnaires'
import { useDashboardData } from '../stores/dashboard'
import { useAuth } from '../stores/auth'
import { useAlumni } from '../stores/alumni'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import { useUserManagement } from '../stores/userManagement'

const { submissions } = useSubmissions()
const { dashboard, fetchDashboardData } = useDashboardData()
const auth = useAuth()
const { alumni, fetchAlumni } = useAlumni()
const { accessControl, permissions } = useUserManagement()
const { fetchActiveQuestionnaire } = useQuestionnaires()
const waitInsights = ref(null)
const responseTotals = ref({ alumni: 0, pengguna: 0 })
const activeOverviewQuestionnaireIds = ref({ alumni: null, pengguna: null })
const animateMetrics = ref(false)
const router = useRouter()
const showCohortNotice = ref(false)
const showLogoutDialog = ref(false)
const initialLoading = ref(true)
const INITIAL_LOADING_LIMIT_MS = 1800
const pageLoading = computed(() => initialLoading.value)
const RESPONSE_SAMPLE_LIMIT_PER_AUDIENCE = 50

const toResponseList = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  if (Array.isArray(payload)) return payload
  return []
}

const toResponseTotal = (payload, fallback = 0) => {
  const metaTotal =
    payload?.meta?.total ??
    payload?.data?.meta?.total ??
    payload?.total ??
    payload?.data?.total
  const parsed = Number(metaTotal)
  if (Number.isFinite(parsed) && parsed >= 0) return parsed
  return fallback
}

const toQuestionnaireList = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  if (Array.isArray(payload)) return payload
  return []
}

const firstQuestionnaireId = (payload) => {
  const list = toQuestionnaireList(payload)
  if (!list.length) return null
  return list[0]?.id || null
}

const fetchWaitTimeInsights = async (questionnaireId = null) => {
  const params = questionnaireId ? { questionnaire_id: questionnaireId } : {}
  try {
    waitInsights.value = await getTracerInsights(params, { timeout: DASHBOARD_TIMEOUT_MS })
  } catch (error) {
    console.warn('Gagal memuat statistik masa tunggu', error)
  }
}

const loadResponsesFromApi = async () => {
  try {
    const [activeAlumni, activePengguna] = await Promise.all([
      fetchActiveQuestionnaire('alumni').catch(() => null),
      fetchActiveQuestionnaire('pengguna').catch(() => null)
    ])

    let alumniId = activeAlumni?.id || activeAlumni?.data?.id || null
    let penggunaId = activePengguna?.id || activePengguna?.data?.id || null

    if (!alumniId || !penggunaId) {
      const [fallbackAlumni, fallbackPengguna] = await Promise.all([
        !alumniId
          ? tracerService
              .getQuestionnaires({ audience: 'alumni', active: true })
              .catch(() => null)
          : Promise.resolve(null),
        !penggunaId
          ? tracerService
              .getQuestionnaires({ audience: 'pengguna', active: true })
              .catch(() => null)
          : Promise.resolve(null),
      ])
      if (!alumniId) alumniId = firstQuestionnaireId(fallbackAlumni)
      if (!penggunaId) penggunaId = firstQuestionnaireId(fallbackPengguna)
    }

    activeOverviewQuestionnaireIds.value = { alumni: alumniId, pengguna: penggunaId }

    const requests = []
    if (alumniId) requests.push({ audience: 'alumni', questionnaireId: alumniId })
    if (penggunaId) requests.push({ audience: 'pengguna', questionnaireId: penggunaId })

    const results = await Promise.all(
      requests.map(async ({ audience, questionnaireId }) => {
        try {
          const [resp, summary] = await Promise.all([
            tracerService.getResponses(
              questionnaireId,
              { include_answers: false },
              { timeout: DASHBOARD_TIMEOUT_MS },
            ),
            tracerService
              .getResponsesSummary(questionnaireId, {}, { timeout: DASHBOARD_TIMEOUT_MS })
              .catch(() => null),
          ])
          const list = toResponseList(resp)
          const summaryTotal =
            Number(summary?.total ?? summary?.data?.total ?? summary?.meta?.total ?? 0) || 0
          return {
            audience,
            total: summaryTotal > 0 ? summaryTotal : toResponseTotal(resp, list.length),
            items: list.slice(0, RESPONSE_SAMPLE_LIMIT_PER_AUDIENCE).map((item) => ({
              ...item,
              __sourceAudience: audience,
            })),
          }
        } catch (err) {
          console.warn(`Gagal memuat respon kuisioner ${audience}`, err)
          return { audience, total: 0, items: [] }
        }
      }),
    )

    const totals = { alumni: 0, pengguna: 0 }
    const combined = []
    results.forEach((result) => {
      totals[result.audience] = Number(result.total) || 0
      combined.push(...result.items)
    })
    responseTotals.value = totals

    const uniqueMap = new Map()
    combined.forEach((item) => {
      const key =
        item?.id != null
          ? String(item.id)
          : `${item?.questionnaire_id || ''}-${item?.createdAt || item?.created_at || Math.random()}`
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item)
      }
    })
    submissions.items = Array.from(uniqueMap.values())
  } catch (error) {
    console.warn('Gagal memuat respon kuisioner dari API', error)
    responseTotals.value = { alumni: 0, pengguna: 0 }
    activeOverviewQuestionnaireIds.value = { alumni: null, pengguna: null }
    submissions.items = []
  }
}

const loadOverviewData = async () => {
  initialLoading.value = true
  const timeoutId = setTimeout(() => {
    initialLoading.value = false
  }, INITIAL_LOADING_LIMIT_MS)
  try {
    await Promise.allSettled([
      fetchDashboardData(),
      fetchAlumni({ per_page: 100 }),
      loadResponsesFromApi(),
    ])
    void fetchWaitTimeInsights(activeOverviewQuestionnaireIds.value.alumni)
  } finally {
    clearTimeout(timeoutId)
    initialLoading.value = false
  }
}

onMounted(() => {
  loadOverviewData()
  requestAnimationFrame(() => {
    animateMetrics.value = true
  })
})

const adminNav = [
  { label: 'Ikhtisar', target: 'overview', icon: 'overview', permissionKey: 'ikhtisar' },
  { label: 'Kuisioner', route: '/admin/kuisioner', icon: 'kuisioner', permissionKey: 'kuisioner' },
  { label: 'Akreditasi tracer', route: '/admin/tracer-akreditasi', icon: 'akreditasi', permissionKey: 'kuisioner' },
  { label: 'Daftar alumni', route: '/admin/alumni', icon: 'alumni', permissionKey: 'alumni' },
  { label: 'Bank soal', route: '/admin/bank-soal', icon: 'bank', permissionKey: 'bankSoal' },
  { label: 'CTA Slider', route: '/admin/cta', icon: 'cta', permissionKey: 'cta' },
  { label: 'Kelola lowongan', route: '/admin/lowongan', icon: 'lowongan', permissionKey: 'lowongan' },
  { label: 'Artikel & tips', route: '/admin/artikel', icon: 'artikel', permissionKey: 'artikel' },
  {
    label: 'User',
    route: '/admin/user',
    icon: 'user',
    permissionKey: 'user',
    children: [
      { label: 'Tambah user', route: { path: '/admin/user', query: { tab: 'tambah' } }, permissionKey: 'user' },
      { label: 'Role & Akses', route: { path: '/admin/user', query: { tab: 'role' } }, permissionKey: 'user' },
      { label: 'Mapping Organisasi', route: { path: '/admin/user', query: { tab: 'mapping' } }, permissionKey: 'user' },
      { label: 'Import/Export', route: { path: '/admin/user', query: { tab: 'import' } }, permissionKey: 'user' },
      { label: 'Log Aktivitas', route: { path: '/admin/user', query: { tab: 'log' } }, permissionKey: 'user' },
    ],
  },
  { label: 'Berita', route: '/admin/berita', icon: 'berita', permissionKey: 'berita' },
]
const normalizeRole = (role) => String(role || '').trim().toLowerCase()
const extractRoleLabel = (role) => {
  if (role && typeof role === 'object') {
    return (
      role.role_name ||
      role.roleName ||
      role.role_id ||
      role.roleId ||
      role.name ||
      role.label ||
      role.title ||
      role.role ||
      role.nama ||
      role.id ||
      ''
    )
  }
  return role
}
const ROLE_ID_MAP = {
  1: 'Super Admin',
  2: 'Admin Universitas',
  3: 'Admin Fakultas',
  4: 'Admin Prodi',
}
const ROLE_MAP = {
  'super admin': 'Super Admin',
  'superadmin': 'Super Admin',
  admin: 'Admin Universitas',
  'admin universitas': 'Admin Universitas',
  'admin fakultas': 'Admin Fakultas',
  'admin prodi': 'Admin Prodi',
  'admin program studi': 'Admin Prodi',
}
const resolveRoleKey = (role) => {
  const extracted = extractRoleLabel(role)
  const extractedNumber =
    typeof extracted === 'number'
      ? extracted
      : typeof extracted === 'string' && extracted.trim() && !Number.isNaN(Number(extracted))
        ? Number(extracted)
        : null
  if (extractedNumber !== null) {
    return ROLE_ID_MAP[extractedNumber] || String(extractedNumber)
  }
  const normalized = normalizeRole(extracted)
  return ROLE_MAP[normalized] || (extracted ? String(extracted).trim() : '')
}
const currentRoleKey = computed(() => resolveRoleKey(auth.user.value?.role))
const normalizedRole = computed(() => normalizeRole(currentRoleKey.value))
const isFacultyAdmin = computed(() => normalizedRole.value === 'admin fakultas')
const isProdiAdmin = computed(() => normalizedRole.value === 'admin prodi')
const isSuperAdmin = computed(() => normalizedRole.value === 'super admin')
const restrictFacultyMenu = computed(
  () => accessControl.value?.restrictFacultyMenu ?? true,
)
const rolePermissions = computed(() => permissions[currentRoleKey.value] || {})
const hasNavAccess = (item) => {
  if (isSuperAdmin.value) return true
  if (!item.permissionKey) return true
  const rolePerms = rolePermissions.value
  if (!rolePerms || typeof rolePerms !== 'object') return false
  return !!rolePerms[item.permissionKey]
}
const getRoutePath = (route) => {
  if (!route) return ''
  if (typeof route === 'string') return route
  if (typeof route === 'object' && typeof route.path === 'string') return route.path
  return ''
}
const normalizeQueryValue = (value) => (value == null ? '' : String(value))
const isRouteMatch = (route, { exact = true } = {}) => {
  const targetPath = getRoutePath(route)
  if (!targetPath) return false
  const current = router.currentRoute.value
  if (exact) {
    if (current.path !== targetPath) return false
  } else if (current.path !== targetPath && !current.path.startsWith(`${targetPath}/`)) {
    return false
  }
  if (typeof route === 'object' && route.query) {
    return Object.entries(route.query).every(
      ([key, value]) => normalizeQueryValue(current.query?.[key]) === normalizeQueryValue(value),
    )
  }
  return true
}
const visibleAdminNav = computed(() => {
  const allowedRoutes = ['/admin', '/admin/kuisioner', '/admin/tracer-akreditasi', '/admin/alumni', '/admin/bank-soal']
  const applyRestrictedMenu = restrictFacultyMenu.value && (isFacultyAdmin.value || isProdiAdmin.value)
  const filterNavItems = (items) =>
    items
      .map((item) => {
        const children = item.children ? filterNavItems(item.children) : []
        const path = getRoutePath(item.route)
        const allowedByRestriction =
          !applyRestrictedMenu || item.target === 'overview' || !path || allowedRoutes.includes(path)
        const allowedSelf = allowedByRestriction && hasNavAccess(item)
        if (!allowedSelf && !children.length) return null
        return { ...item, children }
      })
      .filter(Boolean)
  return filterNavItems(adminNav)
})
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

const defaultWaitTimeTrends = [
  { cohort: '2019', average: 4.5 },
  { cohort: '2020', average: 5.2 },
  { cohort: '2021', average: 4.1 },
  { cohort: '2022', average: 3.2 },
  { cohort: '2023', average: 2.4 },
  { cohort: '2024', average: 1.1 },
]

const waitFieldCandidates = [
  'waitMonths',
  'wait_months',
  'waitMonth',
  'waitingMonths',
  'masaTunggu',
  'waktu',
  'waktuTunggu',
  'bekerja_bulanDapat',
  'bekerja_bulanTidak',
  'mencari_mulaiSetelah',
  'mencari_mulaiSebelum',
]

const entryYearCandidates = [
  'tahunMasuk',
  'tahun_masuk',
  'entryYear',
  'entry_year',
  'tahunAngkatan',
  'angkatan',
  'tahun',
  'tahunLulus',
  'studi_tanggalMasuk',
]

const entryYearSources = [
  (item) => item,
  (item) => item?.raw,
  (item) => item?.raw?.formData,
  (item) => item?.raw?.form_data,
  (item) => item?.formData,
  (item) => item?.form_data,
  (item) => item?.alumni,
  (item) => item?.raw?.alumni,
  (item) => item?.raw?.biodata,
  (item) => item?.raw?.profile,
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

const parseNumericWait = (raw) => {
  if (raw == null || raw === '') return null
  const normalized = String(raw).replace(',', '.')
  const match = normalized.match(/[\d.]+/)
  if (!match) return null
  const num = Number(match[0])
  return Number.isFinite(num) ? num : null
}

const waitFieldSources = [
  (item) => item,
  (item) => item?.raw,
  (item) => item?.raw?.formData,
  (item) => item?.raw?.form_data,
  (item) => item?.formData,
  (item) => item?.form_data,
]

const getWaitFieldValue = (item, field) => {
  for (const getSource of waitFieldSources) {
    const source = getSource(item)
    if (!source || typeof source !== 'object') continue
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      const value = source[field]
      if (value !== '' && value != null) return value
    }
  }
  return null
}

const extractWaitMonths = (item) => {
  if (!item) return null
  for (const field of waitFieldCandidates) {
    const raw = getWaitFieldValue(item, field)
    if (raw == null) continue
    if ((field === 'waktu' || field === 'waktuTunggu') && typeof raw === 'string') {
      const text = raw.toLowerCase()
      if (!text.includes('bln') && !text.includes('bulan')) {
        continue
      }
    }
    const parsed = parseNumericWait(raw)
    if (parsed != null) return parsed
  }
  return null
}

const parseEntryYear = (raw) => {
  if (raw == null || raw === '') return null
  const trimmed = String(raw).trim()
  if (/^\d{4}$/.test(trimmed)) {
    return Number(trimmed)
  }
  const date = new Date(trimmed)
  if (!Number.isNaN(date.getTime())) {
    return date.getFullYear()
  }
  const match = trimmed.match(/\d{4}/)
  if (match) {
    return Number(match[0])
  }
  return null
}

const getEntryField = (item, field) => {
  for (const getSource of entryYearSources) {
    const source = getSource(item)
    if (!source) continue
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      const value = source[field]
      if (value != null && value !== '') {
        return value
      }
    }
  }
  return null
}

const extractEntryYear = (item) => {
  for (const field of entryYearCandidates) {
    const candidate = getEntryField(item, field)
    const parsed = parseEntryYear(candidate)
    if (parsed != null) {
      return parsed
    }
  }
  return null
}

const heroChips = computed(() =>
  dashboard.payload.heroChips?.length ? dashboard.payload.heroChips : defaultHeroChips,
)

const normalizeAudienceTag = (value) => {
  const key = String(value || '').trim().toLowerCase()
  if (!key) return ''
  if (key.startsWith('pengguna')) return 'pengguna'
  if (key.startsWith('umum')) return 'umum'
  if (key.startsWith('alumni')) return 'alumni'
  return ''
}

const resolveResponseType = (item = {}) => {
  const candidates = [
    item.__sourceAudience,
    item.type,
    item.audience,
    item.target_audience,
    item.targetAudience,
    item.questionnaire?.audience,
    item.questionnaire?.targetAudience,
    item.raw?.formData?.target_audience,
    item.raw?.formData?.audience,
    item.raw?.form_data?.target_audience,
    item.raw?.form_data?.audience,
    item.raw?.target_audience,
    item.raw?.audience,
  ]
  for (const candidate of candidates) {
    const normalized = normalizeAudienceTag(candidate)
    if (normalized) return normalized
  }
  const questionnaireId = String(item.questionnaire_id || item.questionnaireId || '')
  if (
    questionnaireId &&
    activeOverviewQuestionnaireIds.value.alumni &&
    questionnaireId === String(activeOverviewQuestionnaireIds.value.alumni)
  ) {
    return 'alumni'
  }
  if (
    questionnaireId &&
    activeOverviewQuestionnaireIds.value.pengguna &&
    questionnaireId === String(activeOverviewQuestionnaireIds.value.pengguna)
  ) {
    return 'pengguna'
  }
  if (item.alumni_id || item.alumniId) return 'alumni'
  return 'alumni'
}

const submissionItems = computed(() =>
  (submissions.items || []).map((item) => ({
    ...item,
    __resolvedType: resolveResponseType(item),
  })),
)
const alumniResponses = computed(() =>
  submissionItems.value.filter((item) => item.__resolvedType === 'alumni'),
)
const penggunaResponses = computed(() =>
  submissionItems.value.filter((item) => item.__resolvedType === 'pengguna'),
)
const hasResponseTotals = computed(
  () =>
    !!activeOverviewQuestionnaireIds.value.alumni ||
    !!activeOverviewQuestionnaireIds.value.pengguna,
)
const summaryOverview = computed(() => dashboard.payload?.overview || {})
const alumniResponseTotal = computed(() => {
  const fromResponsesApi = Number(responseTotals.value.alumni || 0)
  if (hasResponseTotals.value && fromResponsesApi > 0) return fromResponsesApi
  const fromSummaryApi = Number(summaryOverview.value.alumniResponses || 0)
  if (fromSummaryApi > 0) return fromSummaryApi
  return Number(alumniResponses.value.length || 0)
})
const penggunaResponseTotal = computed(() => {
  const fromResponsesApi = Number(responseTotals.value.pengguna || 0)
  if (hasResponseTotals.value && fromResponsesApi > 0) return fromResponsesApi
  const fromSummaryApi = Number(summaryOverview.value.penggunaResponses || 0)
  if (fromSummaryApi > 0) return fromSummaryApi
  return Number(penggunaResponses.value.length || 0)
})
const alumniCount = computed(() =>
  Number(alumni.value.meta?.total || summaryOverview.value.totalAlumni || alumni.value.items?.length || 0),
)
const totalResponses = computed(() => alumniResponseTotal.value + penggunaResponseTotal.value)
const responseRate = computed(() => {
  if (!alumniCount.value) return 0
  return Math.min(100, (alumniResponseTotal.value / alumniCount.value) * 100)
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

const hasCompleteAlumniDataset = computed(() => {
  const total = Number(alumni.value.meta?.total || 0)
  const loaded = Number(alumni.value.items?.length || 0)
  if (!total) return loaded > 0
  return loaded >= total
})

const cohortProgress = computed(() => {
  if (!hasCompleteAlumniDataset.value) {
    if (dashboard.payload.cohortProgress?.length) return dashboard.payload.cohortProgress
    return defaultCohortProgress
  }
  const alumniItems = alumni.value.items || []
  const totalByYear = alumniItems.reduce((acc, item) => {
    const year = item.tahunLulus || item.tahun || item.angkatan || item.tahunMasuk || 'Lainnya'
    acc[year] = (acc[year] || 0) + 1
    return acc
  }, {})
  const respondedByYear = alumniResponses.value.reduce((acc, item) => {
    const year = item.tahun || item.tahunLulus || item.angkatan || item.tahunMasuk || 'Lainnya'
    const key = String(year ?? 'Lainnya')
    if (!acc[key]) acc[key] = new Set()
    const alumniKey =
      item.alumni_id ||
      item.alumniId ||
      item.nim ||
      item.raw?.nim ||
      `${key}-${item.id}`
    acc[key].add(String(alumniKey))
    return acc
  }, {})
  const totalKeys = Object.keys(totalByYear)
  const keys = totalKeys.length ? totalKeys : Object.keys(respondedByYear)
  const rows = keys.map((year) => {
    const total = totalByYear[year] || (respondedByYear[year]?.size || 0)
    const done = respondedByYear[year]?.size || 0
    return {
      cohort: year,
      completion: total ? Math.min(100, Math.round((done / total) * 100)) : 0,
      total,
    }
  })
  return rows.length
    ? rows.sort((a, b) => Number(b.cohort) - Number(a.cohort)).slice(0, 6)
    : []
})

const summaryCardExtras = computed(() => dashboard.payload.summaryCards || [])

const summaryCards = computed(() => [
  {
    label: 'Respon alumni',
    value: alumniResponseTotal.value.toLocaleString('id-ID'),
    delta: `${responseRate.value.toFixed(1)}% dari ${alumniCount.value.toLocaleString('id-ID')} alumni`,
    accent: 'from-teal-500 to-emerald-400',
    icon: 'AL',
  },
  {
    label: 'Respon pengguna',
    value: penggunaResponseTotal.value.toLocaleString('id-ID'),
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
    detail: `${alumniResponseTotal.value} alumni, ${penggunaResponseTotal.value} pengguna`,
  },
  {
    label: 'Completion rate',
    value: `${responseRate.value.toFixed(1)}%`,
    detail: `${alumniCount.value} alumni terdaftar`,
  },
])

const waitTimeEntries = computed(() =>
  alumniResponses.value
    .map((item) => {
      const months = extractWaitMonths(item)
      if (months == null) return null
      const entryYear = extractEntryYear(item)
      const fallbackSource =
        item.tahunMasuk ??
        item.entryYear ??
        item.tahun ??
        item.tahunLulus ??
        item.angkatan ??
        null
      const fallbackYear =
        fallbackSource != null && fallbackSource !== '' ? Number(fallbackSource) : null
      const cohortValue = entryYear ?? (Number.isFinite(fallbackYear) ? fallbackYear : null)
      return {
        months,
        cohort: cohortValue != null ? String(cohortValue) : 'Lainnya',
      }
    })
    .filter(Boolean),
)

const waitTimeStats = computed(() => {
  const entries = waitTimeEntries.value
  const total = entries.length
  if (!total) {
    return {
      average: null,
      total: 0,
      percentWithin3: 0,
      percentWithin6: 0,
      percentAbove6: 0,
    }
  }
  const sum = entries.reduce((acc, entry) => acc + entry.months, 0)
  const within3 = entries.filter((entry) => entry.months <= 3).length
  const within6 = entries.filter((entry) => entry.months <= 6).length
  const above6 = entries.filter((entry) => entry.months > 6).length
  const toPct = (value) => Math.round((value / total) * 100)
  return {
    average: sum / total,
    total,
    percentWithin3: toPct(within3),
    percentWithin6: toPct(within6),
    percentAbove6: toPct(above6),
  }
})

const aggregatedWaitStats = computed(() => {
  const api = waitInsights.value?.waiting_time
  const localStats = waitTimeStats.value
  if (localStats.total) {
    return localStats
  }
  if (api && api.avg_wait_months != null) {
    const apiTotal =
      Number.isFinite(api.total) && api.total > 0 ? api.total : localStats.total
    return {
      average: api.avg_wait_months,
      total: apiTotal,
      percentWithin3:
        typeof api.percent_le_3 === 'number' ? api.percent_le_3 : localStats.percentWithin3,
      percentWithin6:
        typeof api.percent_le_6 === 'number' ? api.percent_le_6 : localStats.percentWithin6,
      percentAbove6:
        typeof api.percent_gt_6 === 'number' ? api.percent_gt_6 : localStats.percentAbove6,
    }
  }
  return localStats
})

const orderCohortRows = (rows = []) => {
  return [...rows].sort((a, b) => {
    const numA = Number(a.cohort)
    const numB = Number(b.cohort)
    const hasA = Number.isFinite(numA)
    const hasB = Number.isFinite(numB)
    if (hasA && hasB) return numB - numA
    if (hasA) return -1
    if (hasB) return 1
    return String(a.cohort || '').localeCompare(String(b.cohort || ''))
  })
}

const waitTimeChart = computed(() => {
  const apiPerCohort = waitInsights.value?.waiting_time?.per_cohort
  if (Array.isArray(apiPerCohort) && apiPerCohort.length) {
    const apiRows = apiPerCohort.map((item) => ({
      cohort: item.label || 'Lainnya',
      average: Number(item.value) || 0,
    }))
    return orderCohortRows(apiRows).slice(0, 6)
  }

  const entries = waitTimeEntries.value
  if (!entries.length) return defaultWaitTimeTrends
  const grouped = entries.reduce((acc, entry) => {
    const key = entry.cohort || 'Lainnya'
    if (!acc[key]) acc[key] = { sum: 0, count: 0, label: key }
    acc[key].sum += entry.months
    acc[key].count += 1
    return acc
  }, {})
  const rows = Object.values(grouped).map((bucket) => ({
    cohort: bucket.label,
    average: Math.round((bucket.sum / bucket.count) * 10) / 10,
  }))
  const ordered = orderCohortRows(rows)
  return ordered.length ? ordered.slice(0, 6) : defaultWaitTimeTrends
})

const waitChartMax = computed(() => {
  const data = waitTimeChart.value
  if (!data.length) return 6
  const maxVal = Math.max(...data.map((item) => item.average))
  return Math.max(maxVal, 1)
})

const mapSubmissionRow = (item) => {
  if (item.__resolvedType === 'pengguna') {
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
  const manual = submissionItems.value
    .filter((item) => ['alumni', 'pengguna'].includes(item.__resolvedType))
    .map(mapSubmissionRow)
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
  const dynamic = submissionItems.value
    .filter((item) => ['alumni', 'pengguna'].includes(item.__resolvedType))
    .slice(0, 4)
    .map((item) => {
    if (item.__resolvedType === 'pengguna') {
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
const openCohortNotice = () => {
  showCohortNotice.value = true
}
const closeCohortNotice = () => {
  showCohortNotice.value = false
}
const openLogoutDialog = () => {
  showLogoutDialog.value = true
}
const closeLogoutDialog = () => {
  showLogoutDialog.value = false
}
const handleLogout = () => {
  auth.logout()
  router.push('/login')
}
const confirmLogout = () => {
  closeLogoutDialog()
  handleLogout()
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
const openSubmenus = ref({})
const isSubmenuOpen = (item) => !!openSubmenus.value[item.label]
const toggleSubmenu = (item) => {
  openSubmenus.value = {
    ...openSubmenus.value,
    [item.label]: !isSubmenuOpen(item),
  }
}

const scrollToSection = (target) => {
  activeSection.value = target
  const el = document.getElementById(target)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const isNavItemActive = (item) => {
  if (item.target) {
    return activeSection.value === item.target
  }
  if (item.route && isRouteMatch(item.route, { exact: !item.children?.length })) return true
  if (item.children?.length) {
    return item.children.some((child) => isNavItemActive(child))
  }
  return false
}
const activeNavChildren = computed(() => {
  const items = visibleAdminNav.value || []
  for (const item of items) {
    if (item.children?.length && isSubmenuOpen(item)) {
      return item.children
    }
  }
  return []
})

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
  akreditasi: [
    'M8 21h8',
    'M12 17v4',
    'M7 4h10v2a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4z',
    'M5 6H3a2 2 0 0 0 0 4h2',
    'M19 6h2a2 2 0 0 1 0 4h-2',
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
  <div
    class="relative flex h-screen overflow-hidden bg-slate-100 text-slate-900"
    :class="{ 'admin-nav-collapsed': isNavCollapsed }"
  >
    <aside
      class="hidden flex-shrink-0 flex-col border-r border-sidebar-border bg-slate-100 text-sidebar-foreground shadow-sm transition-all duration-300 lg:flex"
      :class="isNavCollapsed ? 'w-20 opacity-100 overflow-hidden px-3 py-4' : 'w-80 opacity-100 px-6 py-8'"
    >
      <template v-if="isNavCollapsed">
        <div class="flex h-full flex-col items-center gap-4">
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-md border border-sidebar-border bg-sidebar text-xs font-semibold text-sidebar-foreground/80 shadow-sm transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            @click="toggleNav"
            aria-label="Tampilkan menu"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          </button>
          <img
            :src="adminProfile.avatar"
            alt="Admin avatar"
            class="h-10 w-10 rounded-2xl object-cover shadow-sm"
          />
          <div class="h-px w-full bg-sidebar-border/80" />
          <div class="flex flex-1 flex-col items-center gap-2 overflow-y-auto pb-2">
            <button
              v-for="item in visibleAdminNav"
              :key="`mini-${getRoutePath(item.route) || item.target || item.label}`"
              type="button"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent transition"
              :class="isNavItemActive(item)
                ? 'nav-glass-active text-sidebar-foreground/70'
                : 'border-sidebar-border text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'"
              :title="item.label"
              @click.prevent="handleNavClick(item)"
            >
              <svg
                class="h-5 w-5"
                :class="isNavItemActive(item) ? 'text-teal-600' : 'text-sidebar-foreground/60'"
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
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-md border border-sidebar-border text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            @click="openLogoutDialog"
            aria-label="Logout"
            title="Logout"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H3" />
              <path d="M21 19V5a2 2 0 0 0-2-2H9" />
            </svg>
          </button>
        </div>
      </template>
      <template v-else>
        <div class="mb-4 flex items-center justify-end">
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-md border border-sidebar-border bg-sidebar text-xs font-semibold text-sidebar-foreground/80 shadow-sm transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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

        <nav class="mt-8 flex-1 space-y-2 overflow-y-auto text-sm font-medium text-sidebar-foreground/70">
          <div
            v-for="item in visibleAdminNav"
            :key="getRoutePath(item.route) || item.target || item.label"
            class="space-y-1"
          >
            <div class="flex items-center gap-2">
              <button
                class="flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2 transition"
                :class="
                  isNavItemActive(item)
                    ? 'nav-glass-active text-sidebar-foreground/70'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                "
                @click.prevent="handleNavClick(item)"
              >
                <svg
                  class="h-4 w-4 flex-shrink-0"
                  :class="isNavItemActive(item) ? 'text-teal-600' : 'text-sidebar-foreground/50'"
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
              <button
                v-if="item.children?.length"
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-md border border-sidebar-border text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :class="isSubmenuOpen(item) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''"
                @click.stop="toggleSubmenu(item)"
                aria-label="Toggle submenu"
              >
                <svg
                  class="h-4 w-4 transition duration-150"
                  :class="isSubmenuOpen(item) ? 'rotate-180' : ''"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.044l3.71-3.813a.75.75 0 111.08 1.04l-4.25 4.367a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div v-if="item.children?.length && isSubmenuOpen(item)" class="ml-7 space-y-1">
              <button
                v-for="child in item.children"
                :key="child.label"
                type="button"
                class="flex w-full items-center gap-2 rounded-md border border-transparent px-3 py-1.5 text-xs font-semibold transition"
                :class="
                  isNavItemActive(child)
                    ? 'nav-glass-active text-sidebar-foreground/70'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                "
                @click.prevent="handleNavClick(child)"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="isNavItemActive(child) ? 'bg-teal-500' : 'bg-sidebar-border'" />
                <span class="text-left">{{ child.label }}</span>
              </button>
            </div>
          </div>
        </nav>

        <div class="mt-6 space-y-4">
          <button
            class="w-full rounded-2xl border border-sidebar-border px-4 py-2 text-sm font-semibold text-sidebar-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            @click="openLogoutDialog"
          >
            Logout
          </button>
        </div>
      </template>
    </aside>

    <div class="flex flex-1 min-w-0 min-h-0 flex-col overflow-hidden">
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
              @click="openLogoutDialog"
            >
              Logout
            </button>
          </div>
        </div>
        <div class="mt-3 space-y-2">
          <div class="flex gap-2 overflow-x-auto text-xs font-semibold text-slate-500">
            <div
              v-for="item in visibleAdminNav"
              :key="`mobile-${getRoutePath(item.route) || item.target || item.label}`"
              class="flex items-center gap-1"
            >
              <button
                class="rounded-full border border-slate-200 px-3 py-1"
                :class="isNavItemActive(item) ? 'bg-slate-900 text-white border-slate-900' : ''"
                @click.prevent="handleNavClick(item)"
              >
                {{ item.label }}
              </button>
              <button
                v-if="item.children?.length"
                type="button"
                class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                :class="isSubmenuOpen(item) ? 'bg-slate-100' : ''"
                @click.stop="toggleSubmenu(item)"
                aria-label="Toggle submenu"
              >
                <svg
                  class="h-3.5 w-3.5 transition duration-150"
                  :class="isSubmenuOpen(item) ? 'rotate-180' : ''"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.044l3.71-3.813a.75.75 0 111.08 1.04l-4.25 4.367a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div v-if="activeNavChildren.length" class="flex gap-2 overflow-x-auto text-[11px] font-semibold text-slate-500">
            <button
              v-for="child in activeNavChildren"
              :key="`mobile-sub-${child.label}`"
              class="rounded-full border border-slate-200 px-3 py-1"
              :class="isNavItemActive(child) ? 'bg-teal-600 text-white border-teal-600' : ''"
              @click.prevent="handleNavClick(child)"
            >
              {{ child.label }}
            </button>
          </div>
        </div>
      </div>

      <main
        class="flex-1 overflow-y-auto bg-slate-50/60"
        style="scrollbar-width: thin; scrollbar-color: rgba(51,65,85,0.1) transparent;"
      >
        <div
          class="space-y-10 px-4 py-6 sm:px-6 lg:px-8"
          :class="isNavCollapsed ? 'max-w-7xl' : 'max-w-6xl'"
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
                  <p
                    :class="[
                      'mt-3 text-3xl font-semibold',
                      animateMetrics ? 'metric-number' : 'metric-number-hidden',
                    ]"
                  >
                    {{ card.value }}
                  </p>
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
                  <p
                    :class="[
                      'mt-3 text-2xl font-semibold text-slate-900',
                      animateMetrics ? 'metric-number' : 'metric-number-hidden',
                    ]"
                  >
                    {{ card.value }}
                  </p>
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

          <section
            id="wait-time"
            class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 class="text-lg font-semibold text-slate-900">Statistik masa tunggu</h2>
                <p class="text-sm text-slate-500">
                  Rerata dan distribusi waktu tunggu kerja alumni setelah wisuda.
                </p>
              </div>
              <span class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                {{ aggregatedWaitStats.total ? 'Data alumni terkini' : 'Data referensi' }}
              </span>
            </div>
            <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <article class="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 shadow-inner shadow-slate-100/80">
                <p class="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Rerata tunggu</p>
                <p
                  :class="[
                    'mt-3 text-3xl font-semibold text-slate-900',
                    animateMetrics ? 'metric-number' : 'metric-number-hidden',
                  ]"
                >
                  {{ aggregatedWaitStats.average != null ? aggregatedWaitStats.average.toFixed(1) : '-' }}
                </p>
                <p class="text-xs text-slate-500">bulan</p>
              </article>
              <article class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100/80">
                <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">% alumni ≤3 bulan</p>
                <p
                  :class="[
                    'mt-3 text-3xl font-semibold text-slate-900',
                    animateMetrics ? 'metric-number' : 'metric-number-hidden',
                  ]"
                >
                  {{ aggregatedWaitStats.percentWithin3 }}%
                </p>
                <p
                  :class="[
                    'text-xs text-slate-500',
                    animateMetrics ? 'metric-number' : 'metric-number-hidden',
                  ]"
                >
                  {{ aggregatedWaitStats.total ? `${aggregatedWaitStats.total} respon` : 'Belum ada data' }}
                </p>
              </article>
              <article class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100/80">
                <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">% alumni ≤6 bulan</p>
                <p
                  :class="[
                    'mt-3 text-3xl font-semibold text-slate-900',
                    animateMetrics ? 'metric-number' : 'metric-number-hidden',
                  ]"
                >
                  {{ aggregatedWaitStats.percentWithin6 }}%
                </p>
                <p
                  :class="[
                    'text-xs text-slate-500',
                    animateMetrics ? 'metric-number' : 'metric-number-hidden',
                  ]"
                >
                  {{ aggregatedWaitStats.total ? `${aggregatedWaitStats.total} respon` : 'Belum ada data' }}
                </p>
              </article>
              <article class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100/80">
                <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">% alumni >6 bulan</p>
                <p
                  :class="[
                    'mt-3 text-3xl font-semibold text-slate-900',
                    animateMetrics ? 'metric-number' : 'metric-number-hidden',
                  ]"
                >
                  {{ aggregatedWaitStats.percentAbove6 }}%
                </p>
                <p
                  :class="[
                    'text-xs text-slate-500',
                    animateMetrics ? 'metric-number' : 'metric-number-hidden',
                  ]"
                >
                  {{ aggregatedWaitStats.total ? `${aggregatedWaitStats.total} respon` : 'Belum ada data' }}
                </p>
              </article>
            </div>

            <div class="mt-6 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
              <div class="flex items-center justify-between">
                <p class="text-sm font-semibold text-slate-900">Grafik masa tunggu per tahun masuk</p>
                <span class="text-xs font-semibold uppercase text-slate-500">
                  {{ aggregatedWaitStats.total ? 'Berdasarkan data respon' : 'Referensi tracer' }}
                </span>
              </div>
              <div class="mt-4 space-y-4">
                <div
                  v-for="trend in waitTimeChart"
                  :key="trend.cohort"
                  class="space-y-1"
                >
                  <div class="flex items-center justify-between text-xs text-slate-500">
                    <span>{{ trend.cohort }}</span>
                    <span
                      :class="[
                        'text-slate-900 font-semibold',
                        animateMetrics ? 'metric-number' : 'metric-number-hidden',
                      ]"
                    >
                      {{ trend.average.toFixed(1) }} bln
                    </span>
                  </div>
                  <div class="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      :class="[
                        'h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500',
                        animateMetrics ? 'metric-bar' : 'metric-bar-hidden',
                      ]"
                      :style="{ width: `${Math.min(100, (trend.average / waitChartMax) * 100)}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="progress" class="grid gap-6 xl:grid-cols-3">
            <div class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-200/60">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-lg font-semibold text-slate-900">Progress angkatan</h2>
                  <p class="text-sm text-slate-500">Pantau kelengkapan per cohort</p>
                </div>
                <button class="text-xs font-semibold text-teal-600 hover:text-teal-500" @click="openCohortNotice">
                  Lihat detail
                </button>
              </div>
              <div class="mt-5 space-y-5">
                <div v-for="cohort in cohortProgress" :key="cohort.cohort">
                  <div class="flex items-center justify-between text-sm text-slate-600">
                    <p class="font-semibold text-slate-900">Angkatan {{ cohort.cohort }}</p>
                    <p :class="animateMetrics ? 'metric-number' : 'metric-number-hidden'">
                      {{ cohort.completion }}% / {{ cohort.total }} lulus
                    </p>
                  </div>
                  <div class="mt-2 h-2 rounded-full bg-slate-100">
                    <div
                      :class="[
                        'h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400',
                        animateMetrics ? 'metric-bar' : 'metric-bar-hidden',
                      ]"
                      :style="{ width: `${cohort.completion}%` }"
                    />
                  </div>
                </div>
                <p v-if="!cohortProgress.length" class="text-xs text-slate-500">
                  Belum ada data angkatan dari database.
                </p>
              </div>
              <div class="mt-6 rounded-2xl bg-slate-50 p-4">
                <p class="text-sm font-semibold text-slate-900">Sebaran karier</p>
                <ul class="mt-4 space-y-4 text-sm">
                  <li v-for="job in jobDistribution" :key="job.label">
                    <div class="flex items-center justify-between text-slate-600">
                      <p>{{ job.label }}</p>
                      <p
                        :class="[
                          'font-semibold text-slate-900',
                          animateMetrics ? 'metric-number' : 'metric-number-hidden',
                        ]"
                      >
                        {{ job.percent }}%
                      </p>
                    </div>
                    <div class="mt-2 h-2 rounded-full bg-slate-200/80">
                      <div
                        :class="[
                          'h-full rounded-full',
                          job.color,
                          animateMetrics ? 'metric-bar' : 'metric-bar-hidden',
                        ]"
                        :style="{ width: `${job.percent}%` }"
                      />
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
                      <td :class="['px-4 py-3', animateMetrics ? 'metric-number' : 'metric-number-hidden']">
                        {{ row.angkatan }}
                      </td>
                      <td class="px-4 py-3">
                        <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="getStatusClass(row.status)">{{ row.status }}</span>
                      </td>
                      <td :class="['px-4 py-3', animateMetrics ? 'metric-number' : 'metric-number-hidden']">
                        {{ row.waktu }}
                      </td>
                      <td :class="['px-4 py-3', animateMetrics ? 'metric-number' : 'metric-number-hidden']">
                        {{ row.gaji }}
                      </td>
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
                    <div
                      :class="[
                        'h-full rounded-full bg-gradient-to-r',
                        channel.color,
                        animateMetrics ? 'metric-bar' : 'metric-bar-hidden',
                      ]"
                      :style="{ width: `${channel.completion}%` }"
                    />
                  </div>
                  <p
                    :class="[
                      'mt-2 text-xs text-slate-500',
                      animateMetrics ? 'metric-number' : 'metric-number-hidden',
                    ]"
                  >
                    Completion {{ channel.completion }}%
                  </p>
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

          <div
            v-if="showCohortNotice"
            class="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 px-4 py-6"
          >
            <div class="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
              <div class="flex items-start justify-between">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.28em] text-teal-600">Peringatan</p>
                  <h3 class="mt-2 text-lg font-semibold text-slate-900">Fitur dalam tahap pengembangan</h3>
                </div>
                <button
                  type="button"
                  class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                  @click="closeCohortNotice"
                >
                  Tutup
                </button>
              </div>
              <p class="mt-3 text-sm text-slate-600">
                Detail progress angkatan akan segera tersedia. Terima kasih sudah mencoba fitur ini.
              </p>
              <div class="mt-5 flex justify-end">
                <button
                  type="button"
                  class="rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2 text-xs font-semibold text-white"
                  @click="closeCohortNotice"
                >
                  Mengerti
                </button>
              </div>
            </div>
          </div>
          <Transition name="alert-dialog">
            <div
              v-if="showLogoutDialog"
              class="alert-dialog-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="logout-dialog-title"
              aria-describedby="logout-dialog-desc"
              @click.self="closeLogoutDialog"
            >
              <div class="alert-dialog-panel w-full max-w-md rounded-2xl bg-white p-6 shadow-xl shadow-slate-900/20">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.25em] text-rose-600">Konfirmasi</p>
                    <h3 id="logout-dialog-title" class="text-lg font-semibold text-slate-900">Keluar dari dashboard?</h3>
                    <p id="logout-dialog-desc" class="mt-2 text-sm text-slate-600">
                      Sesi kamu akan berakhir. Kamu perlu login lagi untuk akses admin.
                    </p>
                  </div>
                  <button
                    type="button"
                    class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    @click="closeLogoutDialog"
                  >
                    Tutup
                  </button>
                </div>
                <div class="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    class="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    @click="closeLogoutDialog"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    class="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110"
                    @click="confirmLogout"
                  >
                    Ya, logout
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
        <LoadingOverlay :active="pageLoading" />
      </main>
    </div>
  </div>
</template>

<style scoped>
@keyframes metricFadeUp {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes metricBarGrow {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

.metric-number {
  animation: metricFadeUp 0.6s ease-out both;
}

.metric-number-hidden {
  opacity: 0;
}

.metric-bar {
  transform-origin: left;
  animation: metricBarGrow 0.8s ease-out both;
}

.metric-bar-hidden {
  transform: scaleX(0);
  transform-origin: left;
}
</style>
