<script setup>
import { computed, reactive, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminShell from '../components/AdminShell.vue'
import { useQuestionnaires } from '../stores/questionnaires'
import { useSubmissions } from '../stores/submissions'
import { useAuth } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const { questionnaires, fetchQuestionnaires, fetchQuestions, questionsById } = useQuestionnaires()
const {
  submissions,
  addSubmission,
  addSubmissionBatch,
  fetchSubmissions,
  loading: submissionsLoading,
  error: submissionsError,
  deleteSubmission,
} = useSubmissions()
const { user: currentUser } = useAuth()
const isSuperAdmin = computed(() => (currentUser.value?.role || '').toLowerCase().includes('super'))

const questionnaireId = computed(() => String(route.params.id ?? ''))
const questionnaire = computed(
  () => questionnaires.value.find((item) => String(item.id) === questionnaireId.value) || null,
)
const targetType = computed(() =>
  questionnaire.value?.audience === 'pengguna' ? 'pengguna_alumni' : questionnaire.value?.audience || 'alumni',
)
const uploadInput = ref(null)
const uploadLoading = ref(false)
const uploadMessage = ref('')
const uploadError = ref('')

const formatAnswerValue = (val) => {
  if (val == null) return ''
  if (Array.isArray(val)) return val.join('; ')
  if (typeof val === 'object') {
    return Object.entries(val)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ')
  }
  return String(val ?? '').trim()
}

const bankQuestionsAlumni = [
  { id: 'nama', label: 'Nama lengkap', key: 'nama', statusGroup: 'umum' },
  { id: 'nik', label: 'NIK', key: 'nik', statusGroup: 'umum' },
  { id: 'nim', label: 'NIM', key: 'nim', statusGroup: 'umum' },
  { id: 'fakultas', label: 'Fakultas', key: 'fakultas', statusGroup: 'umum' },
  { id: 'prodi', label: 'Program Studi', key: 'prodi', statusGroup: 'umum' },
  { id: 'tahun', label: 'Tahun Lulus', key: 'tahun', statusGroup: 'umum' },
  { id: 'email', label: 'Email', key: 'email', statusGroup: 'umum' },
  { id: 'status', label: 'Status setelah lulus', key: 'status', statusGroup: 'umum' },
  { id: 'ekstra', label: 'Masukan singkat', key: 'ekstra', statusGroup: 'umum' },
  // Bekerja
  { id: 'bekerja_mulaiSebelum', label: 'Mulai mencari kerja (bulan sebelum lulus)', key: 'bekerja_mulaiSebelum', statusGroup: 'bekerja' },
  { id: 'bekerja_mulaiSetelah', label: 'Mulai mencari kerja (bulan setelah lulus)', key: 'bekerja_mulaiSetelah', statusGroup: 'bekerja' },
  { id: 'bekerja_lebihCepat6Bulan', label: 'Dapat kerja <=6 bulan sebelum/setelah lulus?', key: 'bekerja_lebihCepat6Bulan', statusGroup: 'bekerja' },
  { id: 'bekerja_bulanDapat', label: 'Berapa bulan sampai dapat kerja', key: 'bekerja_bulanDapat', statusGroup: 'bekerja' },
  { id: 'bekerja_bulanTidak', label: 'Berapa bulan sampai dapat kerja', key: 'bekerja_bulanTidak', statusGroup: 'bekerja' },
  { id: 'bekerja_pendapatan', label: 'Pendapatan per bulan', key: 'bekerja_pendapatan', statusGroup: 'bekerja' },
  { id: 'bekerja_tingkatTempatKerja', label: 'Tingkat tempat kerja', key: 'bekerja_tingkatTempatKerja', statusGroup: 'bekerja' },
  { id: 'bekerja_lokasiDetail', label: 'Lokasi bekerja', key: 'bekerja_lokasiDetail', statusGroup: 'bekerja' },
  { id: 'bekerja_provinsi', label: 'Provinsi lokasi bekerja', key: 'bekerja_provinsi', statusGroup: 'bekerja' },
  { id: 'bekerja_kabupaten', label: 'Kabupaten/Kota lokasi bekerja', key: 'bekerja_kabupaten', statusGroup: 'bekerja' },
  { id: 'bekerja_jenisPerusahaan', label: 'Jenis perusahaan/instansi', key: 'bekerja_jenisPerusahaan', statusGroup: 'bekerja' },
  { id: 'bekerja_namaPerusahaan', label: 'Nama perusahaan/kantor', key: 'bekerja_namaPerusahaan', statusGroup: 'bekerja' },
  { id: 'bekerja_namaPimpinan', label: 'Nama pimpinan', key: 'bekerja_namaPimpinan', statusGroup: 'bekerja' },
  { id: 'bekerja_telpPerusahaan', label: 'Kontak perusahaan/pimpinan', key: 'bekerja_telpPerusahaan', statusGroup: 'bekerja' },
  { id: 'bekerja_caraMencari', label: 'Cara mencari pekerjaan', key: 'bekerja_caraMencari', statusGroup: 'bekerja' },
  { id: 'bekerja_perusahaanLamar', label: 'Jumlah perusahaan dilamar', key: 'bekerja_perusahaanLamar', statusGroup: 'bekerja' },
  { id: 'bekerja_perusahaanRespon', label: 'Jumlah perusahaan merespon', key: 'bekerja_perusahaanRespon', statusGroup: 'bekerja' },
  { id: 'bekerja_perusahaanWawancara', label: 'Jumlah undangan wawancara', key: 'bekerja_perusahaanWawancara', statusGroup: 'bekerja' },
  { id: 'bekerja_posisi', label: 'Posisi/Jabatan', key: 'bekerja_posisi', statusGroup: 'bekerja' },
  { id: 'bekerja_kesesuaianBidang', label: 'Kesesuaian bidang dengan pekerjaan', key: 'bekerja_kesesuaianBidang', statusGroup: 'bekerja' },
  { id: 'bekerja_pendidikanSesuai', label: 'Kesesuaian pendidikan dengan pekerjaan', key: 'bekerja_pendidikanSesuai', statusGroup: 'bekerja' },
  // Wirausaha
  { id: 'wira_namaPerusahaan', label: 'Nama dan kontak usaha', key: 'wira_namaPerusahaan', statusGroup: 'wiraswasta' },
  { id: 'wira_telpPerusahaan', label: 'Kontak usaha', key: 'wira_telpPerusahaan', statusGroup: 'wiraswasta' },
  { id: 'wira_jenisPerusahaan', label: 'Jenis usaha', key: 'wira_jenisPerusahaan', statusGroup: 'wiraswasta' },
  { id: 'wira_bidang', label: 'Bidang usaha', key: 'wira_bidang', statusGroup: 'wiraswasta' },
  { id: 'wira_tingkat', label: 'Tingkat usaha', key: 'wira_tingkat', statusGroup: 'wiraswasta' },
  { id: 'wira_kesesuaian', label: 'Kesesuaian usaha dengan pendidikan', key: 'wira_kesesuaian', statusGroup: 'wiraswasta' },
  { id: 'wira_pendidikan', label: 'Pendidikan menunjang usaha?', key: 'wira_pendidikan', statusGroup: 'wiraswasta' },
  // Studi lanjut
  { id: 'studi_lokasi', label: 'Lokasi studi lanjut', key: 'studi_lokasi', statusGroup: 'melanjutkan' },
  { id: 'studi_sumberBiaya', label: 'Sumber biaya studi', key: 'studi_sumberBiaya', statusGroup: 'melanjutkan' },
  { id: 'studi_namaPt', label: 'Nama PT tujuan', key: 'studi_namaPt', statusGroup: 'melanjutkan' },
  { id: 'studi_prodi', label: 'Prodi studi lanjut', key: 'studi_prodi', statusGroup: 'melanjutkan' },
  { id: 'studi_tanggalMasuk', label: 'Tanggal/Tahun masuk', key: 'studi_tanggalMasuk', statusGroup: 'melanjutkan' },
  { id: 'studi_alasan', label: 'Alasan melanjutkan studi', key: 'studi_alasan', statusGroup: 'melanjutkan' },
  // Mencari kerja
  { id: 'mencari_mulaiSebelum', label: 'Mulai mencari (bulan sebelum lulus)', key: 'mencari_mulaiSebelum', statusGroup: 'mencari' },
  { id: 'mencari_mulaiSetelah', label: 'Mulai mencari (bulan setelah lulus)', key: 'mencari_mulaiSetelah', statusGroup: 'mencari' },
  { id: 'mencari_cara', label: 'Cara mencari kerja', key: 'mencari_cara', statusGroup: 'mencari' },
  { id: 'mencari_perusahaanLamar', label: 'Jumlah perusahaan dilamar', key: 'mencari_perusahaanLamar', statusGroup: 'mencari' },
  { id: 'mencari_perusahaanRespon', label: 'Jumlah perusahaan merespon', key: 'mencari_perusahaanRespon', statusGroup: 'mencari' },
  { id: 'mencari_perusahaanWawancara', label: 'Jumlah undangan wawancara', key: 'mencari_perusahaanWawancara', statusGroup: 'mencari' },
  { id: 'mencari_aktif4Minggu', label: 'Aktif mencari 4 minggu terakhir?', key: 'mencari_aktif4Minggu', statusGroup: 'mencari' },
  // Kompetensi dan pendanaan
  {
    id: 'kompetensi_individu',
    label: 'Penilaian kompetensi individu',
    key: 'kompetensi_individu',
    statusGroup: 'umum',
    formatter: (val) => formatAnswerValue(val),
  },
  {
    id: 'kompetensi_pembelajaran',
    label: 'Penilaian kompetensi pembelajaran',
    key: 'kompetensi_pembelajaran',
    statusGroup: 'umum',
    formatter: (val) => formatAnswerValue(val),
  },
  { id: 'sumberDana', label: 'Sumber dana kuliah', key: 'sumberDana', statusGroup: 'umum' },
]

const bankQuestionsPengguna = [
  { id: 'organisasi', label: 'Nama perusahaan/instansi', key: 'organisasi', statusGroup: 'pengguna' },
  { id: 'bidang', label: 'Bidang industri', key: 'bidang', statusGroup: 'pengguna' },
  { id: 'pic', label: 'Nama PIC', key: 'pic', statusGroup: 'pengguna' },
  { id: 'jabatan', label: 'Jabatan PIC', key: 'jabatan', statusGroup: 'pengguna' },
  { id: 'kontak', label: 'Kontak (email/telepon)', key: 'kontak', statusGroup: 'pengguna' },
  { id: 'lokasi', label: 'Kota/Kabupaten', key: 'lokasi', statusGroup: 'pengguna' },
  { id: 'kinerja', label: 'Kinerja alumni kami', key: 'kinerja', statusGroup: 'pengguna' },
  { id: 'kompetensi', label: 'Kompetensi paling menonjol', key: 'kompetensi', statusGroup: 'pengguna' },
  { id: 'pengembangan', label: 'Area pengembangan', key: 'pengembangan', statusGroup: 'pengguna' },
  { id: 'jumlahAlumni', label: 'Jumlah alumni direkrut', key: 'jumlahAlumni', statusGroup: 'pengguna' },
  { id: 'peran', label: 'Peran/divisi yang dibutuhkan', key: 'peran', statusGroup: 'pengguna' },
  { id: 'waktu', label: 'Waktu kebutuhan tenaga kerja', key: 'waktu', statusGroup: 'pengguna' },
  { id: 'catatan', label: 'Catatan tambahan', key: 'catatan', statusGroup: 'pengguna' },
]

const questionFields = computed(() => {
  const dynamic = questionnaire.value?.id ? questionsById(questionnaire.value.id) : []
  if (dynamic.length) {
    return dynamic.map((q) => ({
      id: q.id,
      label: q.label || q.question || 'Pertanyaan',
      key: q.id,
      statusGroup: q.statusCondition || 'umum',
    }))
  }
  return questionnaire.value?.audience === 'pengguna' ? bankQuestionsPengguna : bankQuestionsAlumni
})
const templateHeaders = computed(() => questionFields.value.map((q) => q.key))
const arrayColumns = ['bekerja_caraMencari', 'bekerja_alasanTidakSesuai', 'mencari_cara']
const objectColumns = ['kompetensi_individu', 'kompetensi_pembelajaran']

const parseObjectColumn = (val) => {
  if (!val) return {}
  if (typeof val === 'object' && !Array.isArray(val)) return val
  const parts = String(val)
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)
  return parts.reduce((acc, part) => {
    const [k, v] = part.split(':').map((s) => s.trim())
    if (k) acc[k] = v || ''
    return acc
  }, {})
}

const getRawValue = (raw, key) => {
  if (!raw) return null
  if (Array.isArray(key)) {
    const [group, field] = key
    if (group === 'dynamic') {
      return raw.dynamicAnswers?.[field] ?? raw[field]
    }
  }
  return raw[key]
}

const normalizeStatus = (val, fallback = 'belum') => {
  const key = String(val || fallback).trim().toLowerCase()
  if (questionnaire.value?.audience === 'umum') return key || 'umum'
  return key === 'umum' ? 'belum' : key
}

const toNumber = (val) => {
  const num = Number(String(val ?? '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(num) ? num : 0
}

const normalizeSalaryToJt = (val) => {
  const raw = toNumber(val)
  if (!raw) return 0
  if (raw > 1000) return Math.round((raw / 1_000_000) * 10) / 10
  return Math.round(raw * 10) / 10
}

const mapAlumniRecord = (s) => {
  const waitMonths = toNumber(
    s.waitMonths || s.bekerja_bulanDapat || s.bekerja_bulanTidak || s.mencari_mulaiSetelah || s.mencari_mulaiSebelum,
  )
  const attemptNumber =
    Number(s.attemptNumber || s.attempt_number || s.raw?.attemptNumber || s.raw?.attempt_number || 0) || null
  const nim = s.nim || s.raw?.nim || ''
  return {
    id: s.id,
    nama: s.nama || 'Responden',
    nim,
    prodi: s.prodi || 'Lainnya',
    fakultas: s.fakultas || '-',
    tahun: s.tahun ? Number(s.tahun) : null,
    status: normalizeStatus(s.status),
    waitMonths,
    salary: normalizeSalaryToJt(s.salary || s.bekerja_pendapatan),
    province: s.province || s.bekerja_provinsi || s.studi_lokasi || '-',
    industry: s.industry || s.bekerja_jenisPerusahaan || s.wira_jenisPerusahaan || s.wira_bidang || 'Lainnya',
    eduFit: s.bekerja_pendidikanSesuai || s.wira_pendidikan || s.eduFit || '-',
    timestamp: s.createdAt || s.timestamp || '',
    attemptNumber,
    attemptLabel: attemptNumber ? `Pengisian ke-${attemptNumber}` : '',
    raw: s.raw || s,
  }
}

const mapPenggunaRecord = (s) => ({
  id: s.id,
  nama: s.nama || s.organisasi || 'Pengguna alumni',
  prodi: s.prodi || s.peran || s.bidang || 'Bidang/Peran',
  fakultas: s.fakultas || s.lokasi || '-',
  tahun: null,
  status: 'pengguna',
  waitMonths: 0,
  salary: 0,
  province: s.lokasi || '-',
  industry: s.bidang || 'Lainnya',
  eduFit: s.kinerja || '-',
  timestamp: s.createdAt || s.timestamp || '',
  raw: s.raw || s,
})

const mapUmumRecord = (s) => ({
  id: s.id,
  nama: s.nama || 'Responden',
  prodi: s.prodi || '-',
  fakultas: s.fakultas || '-',
  tahun: null,
  status: 'umum',
  waitMonths: 0,
  salary: 0,
  province: s.province || '-',
  industry: s.industry || '-',
  eduFit: '-',
  timestamp: s.createdAt || s.timestamp || '',
  raw: s.raw || s,
})

const filters = reactive({
  tahun: 'all',
  fakultas: 'all',
  prodi: 'all',
  status: 'all',
})

const submissionsByAudience = computed(() => {
  const targetAudienceType = targetType.value
  return Array.isArray(submissions.items)
    ? submissions.items.filter((item) => (item.type || '').toLowerCase() === targetAudienceType)
    : []
})

const allRecords = computed(() => {
  if (questionnaire.value?.audience === 'pengguna') {
    return submissionsByAudience.value.map(mapPenggunaRecord)
  }
  if (questionnaire.value?.audience === 'umum') {
    return submissionsByAudience.value.map(mapUmumRecord)
  }
  return submissionsByAudience.value.map(mapAlumniRecord)
})

const handleUploadClick = () => {
  uploadMessage.value = ''
  uploadError.value = ''
  uploadInput.value?.click()
}

const ensureHeaders = (rows = []) => {
  if (!rows.length) throw new Error('File kosong.')
  const first = rows[0] || {}
  const headerKeys = Object.keys(first).map((k) => k.toLowerCase().trim())
  const missing = templateHeaders.value.filter((key) => !headerKeys.includes(key.toLowerCase()))
  if (missing.length) {
    throw new Error(`Header tidak sesuai. Pastikan kolom: ${missing.join(', ')}`)
  }
}

const findValue = (row, key) => {
  if (key in row) return row[key]
  const lowerKey = key.toLowerCase()
  const match = Object.keys(row).find((k) => k.toLowerCase().trim() === lowerKey)
  return match ? row[match] : ''
}

const buildPayloadFromRow = (row) => {
  const normalized = {}
  templateHeaders.value.forEach((key) => {
    let value = findValue(row, key) ?? ''
    if (arrayColumns.includes(key)) {
      if (typeof value === 'string') {
        value = value
          .split(';')
          .map((v) => v.trim())
          .filter(Boolean)
      }
      if (!Array.isArray(value)) {
        value = value ? [value] : []
      }
    }
    if (objectColumns.includes(key)) {
      value = parseObjectColumn(value)
    }
    normalized[key] = value
  })

  return {
    type: targetType.value,
    audience: questionnaire.value?.audience || 'alumni',
    nama: normalized.nama || row.nama || 'Responden',
    prodi: normalized.prodi || row.prodi || '',
    fakultas: normalized.fakultas || row.fakultas || '',
    tahun: normalized.tahun || normalized.tahunLulus || row.tahun || '',
    status:
      questionnaire.value?.audience === 'pengguna'
        ? 'pengguna'
        : questionnaire.value?.audience === 'umum'
          ? 'umum'
        : (normalized.status || row.status || 'belum').toLowerCase(),
    waitMonths:
      normalized.bekerja_bulanDapat ||
      normalized.bekerja_bulanTidak ||
      normalized.mencari_mulaiSetelah ||
      normalized.mencari_mulaiSebelum ||
      '',
    salary: normalized.bekerja_pendapatan || row.salary || '',
    province: normalized.bekerja_provinsi || normalized.studi_lokasi || normalized.lokasi || '',
    industry:
      normalized.bekerja_jenisPerusahaan ||
      normalized.wira_bidang ||
      normalized.bidang ||
      '',
    eduFit: normalized.bekerja_pendidikanSesuai || normalized.wira_pendidikan || '',
    raw: { ...normalized },
  }
}

const importFromExcel = async (event) => {
  const file = event.target?.files?.[0]
  if (!file) return
  uploadLoading.value = true
  uploadMessage.value = ''
  uploadError.value = ''
  try {
    const XLSX = await import('xlsx')
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array' })
    const sheet = workbook.SheetNames[0]
    if (!sheet) throw new Error('Sheet tidak ditemukan.')
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { defval: '' })
    ensureHeaders(rows)
    const payloads = rows.map((row) => buildPayloadFromRow(row))
    const count = await addSubmissionBatch(payloads)
    uploadMessage.value = `${count} jawaban berhasil diimpor.`
  } catch (err) {
    uploadError.value = err?.message || 'Gagal mengimpor berkas.'
  } finally {
    uploadLoading.value = false
    if (uploadInput.value) {
      uploadInput.value.value = ''
    }
  }
}

const downloadTemplate = async () => {
  uploadMessage.value = ''
  uploadError.value = ''
  const XLSX = await import('xlsx')
  const headerRow = templateHeaders.value
  const ws = XLSX.utils.aoa_to_sheet([headerRow])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Template')
  const suffix = questionnaire.value?.audience === 'pengguna' ? 'pengguna' : questionnaire.value?.audience || 'alumni'
  XLSX.writeFile(wb, `template-jawaban-${suffix}.xlsx`)
  uploadMessage.value = 'Template berhasil diunduh. Isi header sesuai urutan dan unggah kembali.'
}

const viewMode = ref('all') // all | latest

const applyViewMode = (records = []) => {
  if (viewMode.value !== 'latest' || questionnaire.value?.audience === 'pengguna') return records
  const grouped = new Map()
  records.forEach((item) => {
    const key = String(item.nim || item.raw?.nim || item.nama || item.id || '').toLowerCase()
    const current = grouped.get(key)
    const attempt = Number(item.attemptNumber || 0)
    const ts = new Date(item.timestamp || 0).getTime()
    if (!current) {
      grouped.set(key, item)
      return
    }
    const currAttempt = Number(current.attemptNumber || 0)
    const currTs = new Date(current.timestamp || 0).getTime()
    if (attempt > currAttempt || ts > currTs) {
      grouped.set(key, item)
    }
  })
  return Array.from(grouped.values())
}

const filteredRecords = computed(() =>
  applyViewMode(
    allRecords.value.filter((item) => {
      const matchStatus = filters.status === 'all' || item.status === filters.status
      const matchProdi = filters.prodi === 'all' || item.prodi === filters.prodi
      const matchFak = filters.fakultas === 'all' || item.fakultas === filters.fakultas
      const matchTahun = filters.tahun === 'all' || String(item.tahun) === filters.tahun
      return matchStatus && matchProdi && matchFak && matchTahun
    }),
  ),
)

const summary = computed(() => {
  const data = filteredRecords.value
  const total = data.length
  const statusKeys =
    questionnaire.value?.audience === 'pengguna'
      ? ['pengguna']
      : questionnaire.value?.audience === 'umum'
        ? ['umum']
        : ['bekerja', 'wiraswasta', 'melanjutkan', 'mencari', 'belum', 'pengguna']
  const statusCounts = statusKeys.map((key) => ({
    key,
    label:
      {
        bekerja: 'Bekerja',
        wiraswasta: 'Wirausaha',
        melanjutkan: 'Studi lanjut',
        mencari: 'Mencari kerja',
        belum: 'Belum memungkinkan',
        pengguna: 'Pengguna alumni',
        umum: 'Umum',
      }[key] || key,
    value: data.filter((d) => d.status === key).length,
  }))

  const prodiCounts = Object.entries(
    data.reduce((acc, d) => ({ ...acc, [d.prodi]: (acc[d.prodi] || 0) + 1 }), {}),
  ).map(([label, value]) => ({ label, value }))

  const fakultasCounts = Object.entries(
    data.reduce((acc, d) => ({ ...acc, [d.fakultas]: (acc[d.fakultas] || 0) + 1 }), {}),
  ).map(([label, value]) => ({ label, value }))

  const salaries = data.map((d) => d.salary).filter((n) => n > 0).sort((a, b) => a - b)
  const salaryMean = salaries.length ? salaries.reduce((a, b) => a + b, 0) / salaries.length : 0
  const salaryMedian =
    salaries.length === 0
      ? 0
      : salaries.length % 2 === 1
        ? salaries[(salaries.length - 1) / 2]
        : (salaries[salaries.length / 2 - 1] + salaries[salaries.length / 2]) / 2

  const textPool = data.map((d) => d.industry).filter(Boolean)

  return {
    total,
    statusCounts,
    prodiCounts,
    fakultasCounts,
    salary: {
      mean: salaryMean,
      median: salaryMedian,
      min: salaries[0] || 0,
      max: salaries[salaries.length - 1] || 0,
    },
    textPool,
  }
})

const questionBank = computed(() => {
  const base = questionFields.value

  const extras =
    (questionnaire.value?.extraQuestions || []).map((q) => ({
      id: `extra-${q.id}`,
      label: q.label || q.text || 'Pertanyaan tambahan',
      key: ['dynamic', q.id],
      statusGroup: 'umum',
      formatter: (val) => formatAnswerValue(val),
    })) || []

  return [...base, ...extras]
})

const questionBlocks = computed(() =>
  questionBank.value.map((q) => {
    const answers = []
    const counts = {}

    filteredRecords.value.forEach((resp) => {
      const raw = resp.raw || {}
      if (
        q.statusGroup &&
        q.statusGroup !== 'umum' &&
        q.statusGroup !== 'all' &&
        resp.status !== q.statusGroup
      ) {
        return
      }

      const rawVal = getRawValue(raw, q.key)
      if (
        rawVal == null ||
        rawVal === '' ||
        (Array.isArray(rawVal) && rawVal.length === 0)
      ) {
        return
      }

      const formatted = q.formatter ? q.formatter(rawVal) : formatAnswerValue(rawVal)
      answers.push({
        answer: formatted,
        user: resp.nama,
        prodi: resp.prodi,
        fakultas: resp.fakultas,
        status: resp.status,
      })

      if (Array.isArray(rawVal)) {
        rawVal.forEach((item) => {
          const key = String(item || '').trim()
          if (!key) return
          counts[key] = (counts[key] || 0) + 1
        })
      } else if (typeof rawVal === 'string' && rawVal.trim()) {
        const key = rawVal.trim()
        counts[key] = (counts[key] || 0) + 1
      }
    })

    const summaryCounts = Object.entries(counts).map(([label, value]) => ({ label, value }))

    return {
      ...q,
      answers,
      counts: summaryCounts,
      total: answers.length,
    }
  }),
)

const currentResponseAnswers = computed(() => {
  if (!currentResponse.value) return []
  const raw = currentResponse.value.raw || {}

  return questionBank.value
    .map((q) => {
      if (
        q.statusGroup &&
        q.statusGroup !== 'umum' &&
        q.statusGroup !== 'all' &&
        currentResponse.value.status !== q.statusGroup
      ) {
        return null
      }
      const rawVal = getRawValue(raw, q.key)
      if (
        rawVal == null ||
        rawVal === '' ||
        (Array.isArray(rawVal) && rawVal.length === 0)
      ) {
        return null
      }
      const formatted = q.formatter ? q.formatter(rawVal) : formatAnswerValue(rawVal)
      return {
        id: q.id,
        label: q.label,
        answer: formatted,
      }
    })
    .filter(Boolean)
})

const tab = ref('summary')
const currentResponseIndex = ref(0)
const deleting = ref(false)
const deleteError = ref('')

const currentResponse = computed(() => filteredRecords.value[currentResponseIndex.value] || null)

watch(
  () => filteredRecords.value.length,
  (len) => {
    if (currentResponseIndex.value >= len) {
      currentResponseIndex.value = Math.max(0, len - 1)
    }
  },
)

const handleDeleteCurrent = async () => {
  deleteError.value = ''
  if (!currentResponse.value?.id) return
  const confirmed = window.confirm('Hapus jawaban kuisioner ini? Tindakan tidak dapat dibatalkan.')
  if (!confirmed) return
  deleting.value = true
  try {
    await deleteSubmission(currentResponse.value.id)
  } catch (err) {
    deleteError.value = err?.message || 'Gagal menghapus jawaban.'
  } finally {
    deleting.value = false
  }
}

const uniqueFilters = computed(() => ({
  tahun: Array.from(new Set(allRecords.value.map((d) => d.tahun).filter(Boolean))).map(String),
  fakultas: Array.from(new Set(allRecords.value.map((d) => d.fakultas).filter(Boolean))),
  prodi: Array.from(new Set(allRecords.value.map((d) => d.prodi).filter(Boolean))),
}))

const exportAllCsv = () => {
  const rows = filteredRecords.value
  const header = ['Nama', 'Fakultas', 'Prodi', 'Tahun', 'Status', 'Gaji (jt)', 'Industri', 'Timestamp']
  const csv = [
    header.join(','),
    ...rows.map((r) =>
      [
        r.nama,
        r.fakultas,
        r.prodi,
        r.tahun,
        r.status,
        r.salary,
        r.industry,
        r.timestamp,
      ]
        .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
        .join(','),
    ),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `responses_${questionnaireId.value}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

const exportAllPdf = () => {
  // placeholder action
  window.alert('Export PDF belum diimplementasikan di prototipe ini.')
}

const exportQuestionCsv = (block) => {
  const header = ['Jawaban', 'Jumlah']
  const rows =
    block.type === 'text'
      ? block.answers.map((ans) => [ans, '1'])
      : block.data.map((item) => [item.label, item.value])
  const csv = [header.join(','), ...rows.map((row) => row.map((c) => `"${c}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${block.id}_${questionnaireId.value}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

const goBack = () => {
  router.push({ name: 'AdminKuisioner' })
}

const loadData = async () => {
  if (!questionnaires.value.length) {
    await fetchQuestionnaires()
  }
  if (questionnaire.value?.id) {
    fetchQuestions(questionnaire.value.id)
    await fetchSubmissions({ questionnaireId: questionnaire.value.id })
  }
}

onMounted(loadData)
</script>

<template>
  <AdminShell>
    <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10">
      <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Kuisioner</p>
          <h1 class="mt-1 text-2xl font-semibold text-slate-900">Lihat jawaban</h1>
          <p class="text-xs text-slate-500">
            Ringkasan, per-pertanyaan, dan jawaban individu (mirip Google Form Responses).
          </p>
          <p v-if="questionnaire" class="text-[11px] text-slate-500">
            Kuisioner:
            <span class="font-semibold text-slate-800">{{ questionnaire.title }}</span>
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            @click="goBack"
          >
            Kembali ke daftar
          </button>
          <button
            type="button"
            class="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100"
            @click="exportAllCsv"
          >
            Export All (CSV)
          </button>
          <button
            type="button"
            class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            @click="exportAllPdf"
          >
            Export PDF
          </button>
          <button
            type="button"
            class="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-semibold text-teal-700 shadow-sm transition hover:bg-teal-100"
            :disabled="uploadLoading"
            @click="handleUploadClick"
          >
            {{ uploadLoading ? 'Memproses...' : 'Impor Excel jawaban' }}
          </button>
          <button
            type="button"
            class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            :disabled="uploadLoading"
            @click="downloadTemplate"
          >
            Unduh template
          </button>
        </div>
      </header>
      <div v-if="submissionsError" class="mb-3 rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">
        {{ submissionsError }}
      </div>
      <div v-if="submissionsLoading" class="mb-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">
        Memuat jawaban...
      </div>
      <input
        ref="uploadInput"
        type="file"
        accept=".xlsx,.xls"
        class="hidden"
        @change="importFromExcel"
      />
      <div v-if="uploadMessage || uploadError" class="mb-3 text-xs">
        <p v-if="uploadMessage" class="font-semibold text-emerald-600">{{ uploadMessage }}</p>
        <p v-if="uploadError" class="font-semibold text-rose-600">{{ uploadError }}</p>
      </div>
      <div class="mb-3 rounded-2xl bg-slate-50 p-3 text-[11px] text-slate-600">
        <p class="font-semibold text-slate-800">Format impor (Excel):</p>
        <p>Baris pertama wajib header dengan kolom: {{ templateHeaders.join(', ') }}.</p>
        <p class="text-slate-500">
          Satu baris = satu responden. Kosongkan kolom yang tidak relevan (misal kolom bekerja jika status wiraswasta).
        </p>
      </div>

      <div class="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700">
        <button
          v-for="item in ['summary', 'questions', 'individual']"
          :key="item"
          type="button"
          class="rounded-full border px-3 py-1.5 transition"
          :class="tab === item ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white hover:bg-slate-50'"
          @click="tab = item"
        >
          {{ item === 'summary' ? 'Ringkasan' : item === 'questions' ? 'Per-pertanyaan' : 'Jawaban individu' }}
        </button>

        <select v-model="filters.tahun" class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
          <option value="all">Semua tahun</option>
          <option v-for="t in uniqueFilters.tahun" :key="t" :value="t">{{ t }}</option>
        </select>
        <select v-model="filters.fakultas" class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
          <option value="all">Semua fakultas</option>
          <option v-for="f in uniqueFilters.fakultas" :key="f" :value="f">{{ f }}</option>
        </select>
        <select v-model="filters.prodi" class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
          <option value="all">Semua prodi</option>
          <option v-for="p in uniqueFilters.prodi" :key="p" :value="p">{{ p }}</option>
        </select>
        <select v-model="filters.status" class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
          <option value="all">Semua status</option>
          <option value="bekerja">Bekerja</option>
          <option value="wiraswasta">Wirausaha</option>
          <option value="melanjutkan">Studi lanjut</option>
          <option value="mencari">Mencari kerja</option>
          <option value="belum">Belum memungkinkan</option>
          <option value="pengguna">Pengguna alumni</option>
          <option value="umum">Umum</option>
        </select>
      </div>

      <section v-if="tab === 'summary'" class="space-y-4">
        <div class="grid gap-3 md:grid-cols-4">
          <div class="rounded-2xl bg-slate-50 p-4">
            <p class="text-xs font-semibold text-slate-500">Total respon</p>
            <p class="text-2xl font-semibold text-slate-900">{{ summary.total }}</p>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4 md:col-span-3">
            <p class="text-xs font-semibold text-slate-500">Distribusi status</p>
            <div class="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <div v-for="item in summary.statusCounts" :key="item.key" class="rounded-xl border border-slate-100 bg-white p-3">
                <div class="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>{{ item.label }}</span>
                  <span>{{ item.value }}</span>
                </div>
                <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500"
                    :style="{ width: `${Math.min(100, (item.value / Math.max(1, summary.total)) * 100)}%` }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <div class="rounded-2xl border border-slate-100 bg-white p-4">
            <p class="text-sm font-semibold text-slate-900">Prodi teratas</p>
            <div class="mt-2 space-y-2">
              <div
                v-for="item in summary.prodiCounts.slice(0, 6)"
                :key="item.label"
                class="flex items-center gap-2 text-sm text-slate-700"
              >
                <span class="inline-flex h-2 w-2 rounded-full bg-indigo-500" />
                <span class="flex-1">{{ item.label }}</span>
                <span class="text-xs font-semibold text-slate-500">{{ item.value }}</span>
              </div>
            </div>
          </div>
          <div class="rounded-2xl border border-slate-100 bg-white p-4">
            <p class="text-sm font-semibold text-slate-900">Ringkasan gaji (jt)</p>
            <div class="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div class="rounded-xl bg-slate-50 p-3">
                <p class="font-semibold text-slate-800">Mean</p>
                <p class="text-lg font-semibold text-slate-900">{{ summary.salary.mean.toFixed(1) }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 p-3">
                <p class="font-semibold text-slate-800">Median</p>
                <p class="text-lg font-semibold text-slate-900">{{ summary.salary.median.toFixed(1) }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 p-3">
                <p class="font-semibold text-slate-800">Min</p>
                <p class="text-lg font-semibold text-slate-900">{{ summary.salary.min.toFixed(1) }}</p>
              </div>
              <div class="rounded-xl bg-slate-50 p-3">
                <p class="font-semibold text-slate-800">Max</p>
                <p class="text-lg font-semibold text-slate-900">{{ summary.salary.max.toFixed(1) }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-else-if="tab === 'questions'" class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-sm font-semibold text-slate-900">Jawaban per pertanyaan</h2>
            <p class="text-[11px] text-slate-500">
              Ditampilkan sesuai bank soal dan kuisioner aktif. Setiap jawaban dilabeli user/prodi/fakultas.
            </p>
          </div>
          <p class="text-[11px] text-slate-500">Scroll lembut antar pertanyaan.</p>
        </div>
        <div class="space-y-4">
          <article
            v-for="block in questionBlocks"
            :key="block.id"
            class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Pertanyaan</p>
                <h3 class="text-base font-semibold text-slate-900">{{ block.label }}</h3>
                <p class="text-[11px] text-slate-500">Total jawaban: {{ block.total }}</p>
              </div>
            </div>

            <div v-if="block.counts?.length" class="mt-3 space-y-2">
              <div
                v-for="item in block.counts"
                :key="`${block.id}-${item.label}`"
                class="flex items-center gap-3"
              >
                <div class="flex-1 rounded-full bg-slate-100 p-1">
                  <div
                    class="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-sky-500"
                    :style="{ width: `${Math.min(100, (item.value / Math.max(1, summary.total)) * 100)}%` }"
                  />
                </div>
                <div class="w-40 text-xs font-semibold text-slate-600">
                  {{ item.label }} ({{ item.value }})
                </div>
              </div>
            </div>

            <div class="mt-3 space-y-2">
              <div
                v-for="(ans, idx) in block.answers"
                :key="`${block.id}-${idx}`"
                class="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700"
              >
                <p class="font-semibold text-slate-900">{{ ans.answer }}</p>
                <p class="text-[11px] text-slate-500">
                  Oleh {{ ans.user }} • {{ ans.prodi || '-' }} • {{ ans.fakultas || '-' }} • Status: {{ ans.status }}
                </p>
              </div>
              <p v-if="!block.answers?.length" class="text-xs text-slate-500">Belum ada jawaban untuk pertanyaan ini.</p>
            </div>
          </article>
        </div>
      </section>

      <section v-else class="space-y-4 rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">Jawaban individu</p>
            <h2 class="text-lg font-semibold text-slate-900">Per responden</h2>
            <p v-if="deleteError" class="text-[11px] font-semibold text-rose-600">{{ deleteError }}</p>
          </div>
          <div class="flex items-center gap-2 text-xs font-semibold">
            <div v-if="questionnaire?.audience !== 'pengguna'" class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-full border px-3 py-1 transition"
                :class="viewMode === 'all' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white hover:bg-slate-50'"
                @click="viewMode = 'all'"
              >
                Semua pengisian
              </button>
              <button
                type="button"
                class="rounded-full border px-3 py-1 transition"
                :class="viewMode === 'latest' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white hover:bg-slate-50'"
                @click="viewMode = 'latest'"
              >
                Terakhir per NIM
              </button>
            </div>
            <button
              v-if="isSuperAdmin && currentResponse"
              type="button"
              class="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700 transition hover:bg-rose-100"
              :disabled="deleting"
              @click="handleDeleteCurrent"
            >
              {{ deleting ? 'Menghapus...' : 'Hapus jawaban' }}
            </button>
          </div>
          <div class="flex gap-2 text-xs font-semibold">
            <button
              type="button"
              class="rounded-full border border-slate-200 bg-white px-3 py-1 transition hover:bg-slate-50"
              :disabled="currentResponseIndex === 0"
              @click="currentResponseIndex = Math.max(0, currentResponseIndex - 1)"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              class="rounded-full border border-slate-200 bg-white px-3 py-1 transition hover:bg-slate-50"
              :disabled="currentResponseIndex >= filteredRecords.length - 1"
              @click="currentResponseIndex = Math.min(filteredRecords.length - 1, currentResponseIndex + 1)"
            >
              Berikutnya
            </button>
          </div>
        </div>
        <div v-if="currentResponse" class="space-y-3">
          <div class="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700">
            <span class="rounded-full bg-slate-100 px-3 py-1">{{ currentResponse.nama }}</span>
            <span class="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">{{ currentResponse.prodi }}</span>
            <span class="rounded-full bg-slate-50 px-3 py-1 text-slate-700">{{ currentResponse.fakultas }}</span>
            <span
              class="rounded-full px-3 py-1"
              :class="currentResponse.status === 'bekerja' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'"
            >
              {{ currentResponse.status }}
            </span>
            <span
              v-if="currentResponse.attemptNumber"
              class="rounded-full bg-amber-50 px-3 py-1 text-amber-700"
            >
              Pengisian ke-{{ currentResponse.attemptNumber }}
            </span>
            <span class="text-[11px] text-slate-500">
              Timestamp: {{ currentResponse.timestamp ? new Date(currentResponse.timestamp).toLocaleString('id-ID') : '-' }}
            </span>
          </div>
          <div class="space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              Jawaban lengkap per pertanyaan
            </p>
            <div v-if="currentResponseAnswers.length" class="space-y-2 text-sm text-slate-800">
              <div
                v-for="item in currentResponseAnswers"
                :key="item.id"
                class="rounded-xl bg-white px-3 py-2"
              >
                <p class="text-xs font-semibold text-slate-600">{{ item.label }}</p>
                <p class="text-sm font-semibold text-slate-900">{{ item.answer }}</p>
              </div>
            </div>
            <p v-else class="text-xs text-slate-500">Belum ada jawaban terisi untuk responden ini.</p>
          </div>
        </div>
        <p v-else class="text-sm text-slate-600">Belum ada data respon yang sesuai filter.</p>
      </section>
    </div>
  </AdminShell>
</template>

