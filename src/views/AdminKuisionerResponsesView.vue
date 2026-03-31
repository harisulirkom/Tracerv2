<script setup>
import { computed, reactive, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminShell from '../components/AdminShell.vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import { useQuestionnaires } from '../stores/questionnaires'
import { useSubmissions } from '../stores/submissions'
import { useAuth } from '../stores/auth'
import tracerService from '../services/tracerService'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import { letterHeadContent } from '../constants/letterHeadContent'

const route = useRoute()
const router = useRouter()
const { questionnaires, fetchQuestionnaires, fetchQuestions, questionsById, questionsLoading } = useQuestionnaires()
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
  questionnaire.value?.audience === 'pengguna' ? 'pengguna' : questionnaire.value?.audience || 'alumni',
)
const uploadInput = ref(null)
const uploadLoading = ref(false)
const uploadMessage = ref('')
const uploadError = ref('')
const logoAssetUrl = new URL('../assets/uin.png', import.meta.url).href
const logoDataUrl = ref(null)
const MAX_RESPONSE_LIMIT = 10000

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

const formatFriendlyLabel = (key) => {
  if (!key) return 'Pertanyaan'
  const byUnderscore = String(key).replace(/_/g, ' ')
  const splitCamel = byUnderscore.replace(/([a-z])([A-Z])/g, '$1 $2')
  const withCapitals = splitCamel
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
  return withCapitals
}

const normalizeQuestionId = (value) => String(value ?? '').trim().replace(/^question[-_]/i, '')

const collectSubmissionAnswers = (source = {}) => {
  const raw = source?.raw && typeof source.raw === 'object' ? source.raw : {}
  const candidates = [
    source?.answers,
    source?.responses,
    source?.jawaban,
    source?.response_answers,
    raw?.answers,
    raw?.responses,
    raw?.jawaban,
    raw?.response_answers,
    raw?.data,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
  }

  const objectCandidate = candidates.find(
    (candidate) => candidate && typeof candidate === 'object' && !Array.isArray(candidate),
  )
  if (objectCandidate) {
    return Object.entries(objectCandidate).map(([questionId, answer]) => ({
      question_id: questionId,
      question: questionId,
      jawaban: answer,
    }))
  }
  return []
}

const extractQuestionTextFromAnswer = (answer) => {
  if (!answer) return ''
  if (typeof answer.question === 'string') return answer.question.trim()
  if (answer.question && typeof answer.question === 'object') {
    return (
      answer.question.pertanyaan ||
      answer.question.label ||
      answer.question.question ||
      answer.question.text ||
      answer.question.title ||
      ''
    )
  }
  return (
    answer.pertanyaan ||
    answer.label ||
    answer.question_label ||
    answer.questionText ||
    ''
  )
}

const hasAnyAnswerValue = (value) => {
  if (value == null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value).length > 0
  return true
}

const shouldSkipRawAnswerKey = (key) => {
  const normalized = String(key ?? '').trim().toLowerCase()
  if (!normalized) return true
  const metaKeys = new Set([
    'id',
    'uuid',
    'type',
    'status',
    'audience',
    'questionnaire_id',
    'questionnaireid',
    'alumni_id',
    'alumniid',
    'respondent_code',
    'created_at',
    'updated_at',
    'createdat',
    'updatedat',
    'timestamp',
    'token',
    'raw',
    'answers',
    'responses',
    'response_answers',
    'dynamicanswers',
    'dynamic_answers',
    'formdata',
    'form_data',
    'attemptnumber',
    'attempt_number',
    'attemptlabel',
    'attempt_label',
    'questionnaire',
    'questionnaire_data',
    'questionnairedata',
  ])
  return metaKeys.has(normalized)
}

const flattenRawAnswers = (source = {}) => {
  const entries = []
  const pushEntries = (obj) => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return
    Object.entries(obj).forEach(([key, value]) => {
      if (shouldSkipRawAnswerKey(key)) return
      if (!hasAnyAnswerValue(value)) return
      entries.push([key, value])
    })
  }

  const raw = source?.raw && typeof source.raw === 'object' ? source.raw : {}
  pushEntries(source)
  pushEntries(raw.formData)
  pushEntries(raw.form_data)
  pushEntries(source?.formData)
  pushEntries(source?.form_data)
  return entries
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
  { id: 'ekstra', label: 'Masukan/Saran untuk Pengembangan Kurikulum', key: 'ekstra', statusGroup: 'umum' },
  // Bekerja
  { id: 'bekerja_mulaiSebelum', label: 'Mulai mencari kerja (bulan sebelum lulus)', key: 'bekerja_mulaiSebelum', statusGroup: 'bekerja', tipe: 'number' },
  { id: 'bekerja_mulaiSetelah', label: 'Mulai mencari kerja (bulan setelah lulus)', key: 'bekerja_mulaiSetelah', statusGroup: 'bekerja', tipe: 'number' },
  { id: 'bekerja_lebihCepat6Bulan', label: 'Dapat kerja <=6 bulan sebelum/setelah lulus?', key: 'bekerja_lebihCepat6Bulan', statusGroup: 'bekerja', tipe: 'select', pilihan: ['Ya', 'Tidak'] },
  { id: 'bekerja_bulanDapat', label: 'Berapa bulan sampai dapat kerja', key: 'bekerja_bulanDapat', statusGroup: 'bekerja', tipe: 'number' },
  { id: 'bekerja_bulanTidak', label: 'Berapa bulan sampai dapat kerja', key: 'bekerja_bulanTidak', statusGroup: 'bekerja', tipe: 'number' },
  { id: 'bekerja_pendapatan', label: 'Pendapatan per bulan', key: 'bekerja_pendapatan', statusGroup: 'bekerja', tipe: 'number' },
  { id: 'bekerja_tingkatTempatKerja', label: 'Tingkat tempat kerja', key: 'bekerja_tingkatTempatKerja', statusGroup: 'bekerja', tipe: 'select', pilihan: ['Lokal/Wilayah/Wiraswasta tidak berbadan hukum', 'Nasional/Wiraswasta berbadan hukum', 'Multinasional/Internasional'] },
  { id: 'bekerja_lokasiDetail', label: 'Lokasi bekerja', key: 'bekerja_lokasiDetail', statusGroup: 'bekerja', tipe: 'text' },
  { id: 'bekerja_provinsi', label: 'Provinsi lokasi bekerja', key: 'bekerja_provinsi', statusGroup: 'bekerja', tipe: 'select', pilihan: [] }, // Populate dynamically from data usually
  { id: 'bekerja_kabupaten', label: 'Kabupaten/Kota lokasi bekerja', key: 'bekerja_kabupaten', statusGroup: 'bekerja', tipe: 'select', pilihan: [] },
  { id: 'bekerja_jenisPerusahaan', label: 'Jenis perusahaan/instansi', key: 'bekerja_jenisPerusahaan', statusGroup: 'bekerja', tipe: 'select', pilihan: ['Instansi Pemerintah', 'BUMN/BUMD', 'Institusi/Organisasi Multilateral', 'Organisasi Non-Profit/Lembaga Swadaya Masyarakat', 'Perusahaan Swasta', 'Wiraswasta', 'Lainnya'] },
  { id: 'bekerja_namaPerusahaan', label: 'Nama perusahaan/kantor', key: 'bekerja_namaPerusahaan', statusGroup: 'bekerja', tipe: 'text' },
  { id: 'bekerja_namaPimpinan', label: 'Nama pimpinan', key: 'bekerja_namaPimpinan', statusGroup: 'bekerja', tipe: 'text' },
  { id: 'bekerja_telpPerusahaan', label: 'Kontak perusahaan/pimpinan', key: 'bekerja_telpPerusahaan', statusGroup: 'bekerja', tipe: 'text' },
  { id: 'bekerja_caraMencari', label: 'Cara mencari pekerjaan', key: 'bekerja_caraMencari', statusGroup: 'bekerja', tipe: 'select', pilihan: ['Melamar ke perusahaan', 'Pergi ke bursa kerja', 'Mencari lewat internet/iklan online', 'Dihubungi oleh perusahaan', 'Menghubungi Kemahasiswaan/Alumni', 'Membangun jejaring (networking)', 'Melalui relasi/keluarga', 'Membangun bisnis sendiri', 'Lainnya'] },
  { id: 'bekerja_perusahaanLamar', label: 'Jumlah perusahaan dilamar', key: 'bekerja_perusahaanLamar', statusGroup: 'bekerja', tipe: 'number' },
  { id: 'bekerja_perusahaanRespon', label: 'Jumlah perusahaan merespon', key: 'bekerja_perusahaanRespon', statusGroup: 'bekerja', tipe: 'number' },
  { id: 'bekerja_perusahaanWawancara', label: 'Jumlah undangan wawancara', key: 'bekerja_perusahaanWawancara', statusGroup: 'bekerja', tipe: 'number' },
  { id: 'bekerja_posisi', label: 'Posisi/Jabatan', key: 'bekerja_posisi', statusGroup: 'bekerja', tipe: 'select', pilihan: ['Founder/Owner', 'C-Level (CEO/CTO/etc)', 'Manager/Team Lead', 'Supervisor', 'Staff/Officer', 'Freelance/Part-time', 'Intern/Magang', 'Lainnya'] },
  { id: 'bekerja_kesesuaianBidang', label: 'Kesesuaian bidang dengan pekerjaan', key: 'bekerja_kesesuaianBidang', statusGroup: 'bekerja', tipe: 'select', pilihan: ['Sangat sesuai', 'Sesuai', 'Cukup sesuai', 'Kurang sesuai', 'Tidak sesuai'] },
  { id: 'bekerja_pendidikanSesuai', label: 'Kesesuaian pendidikan dengan pekerjaan', key: 'bekerja_pendidikanSesuai', statusGroup: 'bekerja', tipe: 'select', pilihan: ['Setingkat lebih tinggi', 'Tingkat yang sama', 'Setingkat lebih rendah', 'Tidak perlu pendidikan tinggi'] },
  // Wirausaha
  { id: 'wira_namaPerusahaan', label: 'Nama dan kontak usaha', key: 'wira_namaPerusahaan', statusGroup: 'wiraswasta', tipe: 'text' },
  { id: 'wira_telpPerusahaan', label: 'Kontak usaha', key: 'wira_telpPerusahaan', statusGroup: 'wiraswasta', tipe: 'text' },
  { id: 'wira_jenisPerusahaan', label: 'Jenis usaha', key: 'wira_jenisPerusahaan', statusGroup: 'wiraswasta', tipe: 'select', pilihan: ['Perdagangan', 'Jasa', 'Manufaktur/Produksi', 'Pertanian/Peternakan', 'Teknologi/Startup', 'Kreatif/Seni', 'Lainnya'] },
  { id: 'wira_bidang', label: 'Bidang usaha', key: 'wira_bidang', statusGroup: 'wiraswasta', tipe: 'select', pilihan: ['Kuliner', 'Fashion', 'Pendidikan', 'Kesehatan', 'Konstruksi', 'Otomotif', 'Desain/Media', 'TI/Software', 'Lainnya'] },
  { id: 'wira_tingkat', label: 'Tingkat usaha', key: 'wira_tingkat', statusGroup: 'wiraswasta', tipe: 'select', pilihan: ['Lokal', 'Nasional', 'Internasional'] },
  { id: 'wira_kesesuaian', label: 'Kesesuaian usaha dengan pendidikan', key: 'wira_kesesuaian', statusGroup: 'wiraswasta', tipe: 'select', pilihan: ['Sangat sesuai', 'Sesuai', 'Kurang sesuai', 'Tidak sesuai'] },
  { id: 'wira_pendidikan', label: 'Pendidikan menunjang usaha?', key: 'wira_pendidikan', statusGroup: 'wiraswasta', tipe: 'select', pilihan: ['Sangat menunjang', 'Menunjang', 'Kurang menunjang', 'Tidak menunjang'] },
  // Studi lanjut
  { id: 'studi_lokasi', label: 'Lokasi studi lanjut', key: 'studi_lokasi', statusGroup: 'melanjutkan', tipe: 'select', pilihan: ['Dalam Negeri', 'Luar Negeri'] },
  { id: 'studi_sumberBiaya', label: 'Sumber biaya studi', key: 'studi_sumberBiaya', statusGroup: 'melanjutkan', tipe: 'select', pilihan: ['Biaya Sendiri', 'Beasiswa Pemerintah', 'Beasiswa Swasta/Institusi', 'Lainnya'] },
  { id: 'studi_namaPt', label: 'Nama PT tujuan', key: 'studi_namaPt', statusGroup: 'melanjutkan', tipe: 'text' },
  { id: 'studi_prodi', label: 'Prodi studi lanjut', key: 'studi_prodi', statusGroup: 'melanjutkan', tipe: 'text' },
  { id: 'studi_tanggalMasuk', label: 'Tanggal/Tahun masuk', key: 'studi_tanggalMasuk', statusGroup: 'melanjutkan', tipe: 'date' },
  { id: 'studi_alasan', label: 'Alasan melanjutkan studi', key: 'studi_alasan', statusGroup: 'melanjutkan', tipe: 'select', pilihan: ['Tuntutan profesi', 'Mendalami ilmu', 'Belum dapat kerja', 'Lainnya'] },
  // Mencari kerja
  { id: 'mencari_mulaiSebelum', label: 'Mulai mencari (bulan sebelum lulus)', key: 'mencari_mulaiSebelum', statusGroup: 'mencari', tipe: 'number' },
  { id: 'mencari_mulaiSetelah', label: 'Mulai mencari (bulan setelah lulus)', key: 'mencari_mulaiSetelah', statusGroup: 'mencari', tipe: 'number' },
  { id: 'mencari_cara', label: 'Cara mencari kerja', key: 'mencari_cara', statusGroup: 'mencari', tipe: 'select', pilihan: ['Job portal', 'Website perusahaan', 'LinkedIn', 'Job fair', 'Relasi', 'Media sosial', 'Lainnya'] },
  { id: 'mencari_perusahaanLamar', label: 'Jumlah perusahaan dilamar', key: 'mencari_perusahaanLamar', statusGroup: 'mencari', tipe: 'number' },
  { id: 'mencari_perusahaanRespon', label: 'Jumlah perusahaan merespon', key: 'mencari_perusahaanRespon', statusGroup: 'mencari', tipe: 'number' },
  { id: 'mencari_perusahaanWawancara', label: 'Jumlah undangan wawancara', key: 'mencari_perusahaanWawancara', statusGroup: 'mencari', tipe: 'number' },
  { id: 'mencari_aktif4Minggu', label: 'Aktif mencari 4 minggu terakhir?', key: 'mencari_aktif4Minggu', statusGroup: 'mencari', tipe: 'select', pilihan: ['Ya', 'Tidak'] },
  // Kompetensi dan pendanaan
  {
    id: 'kompetensi_individu',
    label: 'Penilaian kompetensi individu',
    key: 'kompetensi_individu',
    statusGroup: 'umum',
    tipe: 'scale',
    formatter: (val) => formatAnswerValue(val),
  },
  {
    id: 'kompetensi_pembelajaran',
    label: 'Penilaian kompetensi pembelajaran',
    key: 'kompetensi_pembelajaran',
    statusGroup: 'umum',
    tipe: 'scale',
    formatter: (val) => formatAnswerValue(val),
  },
  { id: 'sumberDana', label: 'Sumber dana kuliah', key: 'sumberDana', statusGroup: 'umum', tipe: 'select', pilihan: ['Biaya Sendiri/Keluarga', 'Beasiswa Bidikmisi/KIP-K', 'Beasiswa PPA', 'Beasiswa Lainnya'] },
]

const bankQuestionsPengguna = [
  { id: 'organisasi', label: 'Nama perusahaan/instansi', key: 'organisasi', statusGroup: 'pengguna' },
  { id: 'nama_alumni', label: 'Nama Alumni yang dinilai', key: 'nama_alumni', statusGroup: 'pengguna' },
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

const extractQuestionLabel = (question) => {
  if (!question) return null
  const candidates = [
    question.label,
    question.pertanyaan,
    question.question,
    question.text,
    question.prompt,
    question.title,
    question.title_en,
    question.questionText,
    question.question_label,
  ]
  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'string' && candidate.trim().length) {
      const val = candidate.trim()
      // If it's just a number, it's probably an ID placeholder, keep looking
      if (/^\d+$/.test(val) && candidates.indexOf(candidate) < candidates.length - 1) continue
      return val
    }
  }
  return null
}

const deriveStatusFromLabel = (label) => {
  const l = (label || '').toLowerCase()
  if (l.includes('wirausaha') || l.includes('usaha sendiri') || l.includes('bisnis')) return 'wiraswasta'
  if (l.includes('studi') || l.includes('lanjut') || l.includes('kuliah') || l.includes('universitas')) return 'melanjutkan'
  if (l.includes('mencari') || l.includes('lamar')) return 'mencari'
  if (l.includes('kerja') || l.includes('gaji') || l.includes('kantor') || l.includes('perusahaan')) return 'bekerja'
  return null
}

const questionFields = computed(() => {
  const audience = questionnaire.value?.audience || 'alumni'
  // Mark static questions as isBank
  const bank = (audience === 'pengguna' ? bankQuestionsPengguna : bankQuestionsAlumni).map(q => ({ ...q, isBank: true }))
  const dynamic = questionnaire.value?.id ? questionsById(questionnaire.value.id) : []
  
  const mappedDynamic = dynamic.map((q) => ({
    id: q.id,
    label: extractQuestionLabel(q) || formatFriendlyLabel(q.id),
    key: q.id,
    // Use stored statusCondition, or backend column, or heuristic derivation, or fallback
    statusGroup: q.statusCondition || q.status_condition || deriveStatusFromLabel(extractQuestionLabel(q)) || 'umum',
    urutan: Number(q.urutan || 99999),
    tipe: q.tipe,
    pilihan: q.pilihan,
    isBank: false, // Dynamic questions are not from Bank Soal
  })).sort((a, b) => a.urutan - b.urutan)

  // Prioritize dynamic questions because they have the correct numeric IDs for matching
  const combined = [...mappedDynamic]
  
  // Add bank questions only if they aren't already represented by a dynamic question
  bank.forEach((bq) => {
    const bqLabel = String(bq.label || '').toLowerCase().trim()
    const isPresent = mappedDynamic.some(
      (dq) => {
        const dqLabel = String(dq.label || '').toLowerCase().trim()
        return dqLabel === bqLabel || String(dq.key) === String(bq.id)
      }
    )
    if (!isPresent) combined.push(bq)
  })

  return combined
})
const hasQuestionnaireQuestions = computed(() => {
  const list = questionnaire.value?.id ? questionsById(questionnaire.value.id) : []
  return Array.isArray(list) && list.length > 0
})
const scopedQuestionFields = computed(() =>
  hasQuestionnaireQuestions.value
    ? questionFields.value.filter((q) => !q.isBank)
    : questionFields.value,
)
const templateHeaders = computed(() =>
  questionFields.value.map((q) => String(q.key ?? '').trim()),
)
const templateLabelRow = computed(() =>
  questionFields.value.map((q) => q.label || formatFriendlyLabel(q.key)),
)
const templateLabelRowNormalized = computed(() =>
  templateLabelRow.value.map((label) => String(label ?? '').trim().toLowerCase()),
)

const filters = reactive({
  tahun: 'all',
  fakultas: 'all',
  prodi: 'all',
  status: ['all'],
  selectedQuestions: [],
  questionId: '',
  answerValue: '',
})

const statusOptions = [
  { value: 'bekerja', label: 'Bekerja' },
  { value: 'wiraswasta', label: 'Wirausaha' },
  { value: 'melanjutkan', label: 'Studi lanjut' },
  { value: 'mencari', label: 'Mencari kerja' },
  { value: 'belum', label: 'Belum memungkinkan' },
  { value: 'pengguna', label: 'Pengguna alumni' },
  { value: 'umum', label: 'Umum' },
]

const openFilter = ref(null) // 'status' | 'questions' | null
const toggleFilter = (name) => {
  openFilter.value = openFilter.value === name ? null : name
}

const toggleStatus = (val) => {
  if (val === 'all') {
    filters.status = ['all']
  } else {
    // Remove 'all' if present
    filters.status = filters.status.filter(s => s !== 'all')
    if (filters.status.includes(val)) {
      filters.status = filters.status.filter(s => s !== val)
      if (filters.status.length === 0) filters.status = ['all']
    } else {
      filters.status.push(val)
    }
  }
}

const toggleQuestion = (id) => {
  if (filters.selectedQuestions.includes(id)) {
    filters.selectedQuestions = filters.selectedQuestions.filter(q => q !== id)
  } else {
    filters.selectedQuestions.push(id)
  }
}

// Dynamic Filter Computeds
const availableFilterQuestions = computed(() => {
  return scopedQuestionFields.value.filter((q) => {
    // 1. If status is NOT 'all', show questions from those statuses. 
    // If status IS 'all', show all bank questions.
    const isAll = filters.status.includes('all')
    const qStatus = String(q.statusGroup || '').trim().toLowerCase()
    const matchesStatus = isAll || filters.status.some(s => s.toLowerCase() === qStatus)
    if (!matchesStatus) return false

    // 2. Must be Choice Type (Strict Pilihan Ganda)
    // Exclude 'scale', 'likert', 'text', 'number', 'date'
    const allowedTypes = ['radio', 'select', 'checkbox', 'pilihan ganda', 'multiple_choice']
    return allowedTypes.includes((q.tipe || '').toLowerCase())
  })
})
const isPenggunaAudience = computed(() => audienceType.value === 'pengguna')

const templateSampleRow = computed(() =>
  questionFields.value.map((field) => {
    const key = String(field.key ?? '').toLowerCase()
    if (isPenggunaAudience.value) {
      if (key.includes('organisasi')) return 'PT Sukses Bersama'
      if (key.includes('bidang')) return 'Teknologi Informasi'
      if (key.includes('pic')) return 'Rahmat Fajar'
      if (key.includes('jabatan')) return 'HR Manager'
      if (key.includes('kontak')) return 'hr@contoh.com'
      if (key.includes('jumlah')) return '5'
      if (key.includes('peran')) return 'Software Developer'
      if (key.includes('waktu')) return 'Q1 2026'
      if (key.includes('kinerja') || key.includes('kompetensi') || key.includes('pengembangan')) {
        return 'Sangat baik'
      }
      if (key.includes('catatan')) return 'Punya kebutuhan pekerja remote.'
    } else {
      if (key.includes('nama')) return 'Alya Putri'
      if (key.includes('nim')) return '190102001'
      if (key.includes('nik')) return '0001234567890123'
      if (key.includes('prodi')) return 'Teknik Informatika'
      if (key.includes('fakultas')) return 'Teknik'
      if (key.includes('tahun')) return '2023'
      if (key.includes('email')) return 'alumni@example.com'
      if (key.includes('status')) return 'bekerja'
      if (key.includes('pendapatan') || key.includes('gaji')) return '5000000'
      if (key.includes('lokasi')) return 'Jakarta'
      if (key.includes('perusahaan') || key.includes('usaha') || key.includes('instansi')) return 'PT Contoh'
    }
    if (key.includes('telepon') || key.includes('telp') || key.includes('kontak')) return '08123456789'
    if (key.includes('bulan')) return '2'
    return `Contoh ${field.label || formatFriendlyLabel(field.key)}`
  }),
)

const templateSampleRowNormalized = computed(() =>
  templateSampleRow.value.map((cell) => String(cell ?? '').trim().toLowerCase()),
)

const pageLoading = computed(
  () => submissionsLoading.value || questionsLoading.value || uploadLoading.value,
)
const statusLabelMap = {
  all: 'Semua status',
  umum: 'Umum',
  pengguna: 'Pengguna alumni',
  bekerja: 'Bekerja',
  wiraswasta: 'Wirausaha',
  melanjutkan: 'Melanjutkan pendidikan',
  mencari: 'Mencari kerja',
  belum: 'Belum memungkinkan bekerja',
  melanjutkan_pendidikan: 'Melanjutkan pendidikan',
  mencari_kerja: 'Mencari kerja',
  belum_bekerja: 'Belum memungkinkan bekerja',
}
const getStatusLabel = (value) => {
  if (!value) return statusLabelMap.all
  const normalized = String(value).trim().toLowerCase()
  if (statusLabelMap[normalized]) return statusLabelMap[normalized]
  const cleaned = normalized.replace(/_/g, ' ')
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}
const audienceType = computed(() => {
  const raw = questionnaire.value?.audience || questionnaire.value?.targetAudience
  return raw ? String(raw).trim().toLowerCase() : 'alumni'
})

const audienceDisplayLabel = computed(() => {
  if (audienceType.value === 'pengguna') return 'Pengguna alumni'
  if (audienceType.value === 'umum') return 'Umum'
  return 'Alumni'
})

const templateQuestionListRows = computed(() =>
  questionFields.value.map((field) => {
    const statusKey = field.statusGroup || 'umum'
    const label = getStatusLabel(statusKey)
    const note =
      ['umum', 'all'].includes(statusKey) || label === statusLabelMap.all
        ? ''
        : `Tampilkan hanya saat status: ${label}`
    return [
      String(field.key ?? '').trim(),
      field.label || formatFriendlyLabel(field.key),
      audienceDisplayLabel.value,
      label,
      note,
    ]
  }),
)
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

  const attemptDynamicLookup = (identifier) => {
    const dyn = raw.dynamicAnswers || raw.dynamic_answers || raw.dynamic || {}
    const formData = raw.formData || raw.form_data || {}
    const normalized = Number.isNaN(Number(identifier)) ? String(identifier) : String(Number(identifier))
    
    // Check dynamicAnswers
    if (dyn && Object.prototype.hasOwnProperty.call(dyn, normalized)) {
      return dyn[normalized]
    }
    // Check formData
    if (formData && Object.prototype.hasOwnProperty.call(formData, normalized)) {
      return formData[normalized]
    }
    if (formData && Object.prototype.hasOwnProperty.call(formData, `question-${normalized}`)) {
      return formData[`question-${normalized}`]
    }

    if (Array.isArray(dyn) && dyn.length && dyn[normalized]) {
      return dyn[normalized]
    }
    return null
  }

  if (Array.isArray(key)) {
    const [group, field] = key
    if (group === 'dynamic') {
      return raw.dynamicAnswers?.[field] ?? raw[field]
    }
  }

  if (typeof key === 'number' || /^[0-9]+$/.test(String(key))) {
    const candidate = attemptDynamicLookup(key)
    if (candidate !== null && candidate !== undefined) {
      return candidate
    }
  }

  // Direct access attempt
  if (raw[key] !== undefined) return raw[key]

  // Check formData for string keys too
  const formData = raw.formData || raw.form_data || {}
  if (formData && Object.prototype.hasOwnProperty.call(formData, key)) {
      return formData[key]
  }

  // IMPORTANT: Fallback for Static Bank Keys (e.g. 'bekerja_jenisPerusahaan')
  // These keys are virtual in frontend but stored as questions in 'answers' array in backend.
  // We match by Question Label/Text.
  if (Array.isArray(raw.answers) && typeof key === 'string') {
     const qDef = questionFields.value ? questionFields.value.find(q => q.key === key) : null
     if (qDef && qDef.label) {
         const match = raw.answers.find(a => {
             // Handle 'question' structure which might be string or object
             const qText = typeof a.question === 'object' ? (a.question.pertanyaan || a.question.label) : a.question
             const qStr = String(qText || '').toLowerCase()
             const labelStr = String(qDef.label).toLowerCase()
             const idStr = String(qDef.id).replace(/_/g, ' ').toLowerCase()
             
             // Match if question text contains the label or the ID-derived phrase
             return qStr.includes(labelStr) || (idStr.length > 4 && qStr.includes(idStr))
         })
         if (match) return match.jawaban
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
  // Strip all non-digits (handle 5.000.000 or Rp 5.000.000)
  const num = Number(String(val ?? '').replace(/[^0-9]/g, ''))
  return Number.isFinite(num) ? num : 0
}

const normalizeSalaryToJt = (val) => {
  const raw = toNumber(val)
  if (!raw) return 0
  if (raw > 1000) return Math.round((raw / 1_000_000) * 10) / 10
  return Math.round(raw * 10) / 10
}

const normalizeAnswerText = (value) => {
  if (value === undefined || value === null) return ''
  if (Array.isArray(value)) {
    return value.map((val) => String(val ?? '').trim()).filter(Boolean).join('; ')
  }
  if (typeof value === 'object') return ''
  return String(value ?? '').trim()
}

const hasAnswerValue = (value) => normalizeAnswerText(value) !== ''

const getPenggunaValue = (record, keys = [], fallbackKeys = []) => {
  const raw = record?.raw || record || {}
  const list = Array.isArray(keys) ? keys : [keys]
  for (const key of list) {
    if (!key) continue
    const val = getRawValue(raw, key)
    if (hasAnswerValue(val)) return normalizeAnswerText(val)
  }
  const fallbackList = Array.isArray(fallbackKeys) ? fallbackKeys : [fallbackKeys]
  for (const key of fallbackList) {
    if (!key) continue
    const val = record?.[key]
    if (hasAnswerValue(val)) return normalizeAnswerText(val)
  }
  return ''
}

const buildTopList = (records = [], keys = [], limit = 5, fallbackKeys = []) => {
  const bucket = new Map()
  records.forEach((record) => {
    const label = getPenggunaValue(record, keys, fallbackKeys)
    if (!label) return
    const normalized = label.toLowerCase()
    const current = bucket.get(normalized) || { label, count: 0 }
    current.count += 1
    bucket.set(normalized, current)
  })
  return Array.from(bucket.values()).sort((a, b) => b.count - a.count).slice(0, limit)
}

const normalizeIndustryLabel = (value) => {
  const text = String(value || '').trim()
  if (!text || text === '-' || text.toLowerCase() === 'null' || text.toLowerCase() === 'undefined') return ''
  return text
}

const extractIndustryLabels = (record) => {
  const raw = record?.raw || record || {}
  const primary =
    getRawValue(raw, 'bekerja_jenisPerusahaan') ||
    getRawValue(raw, 'wira_jenisPerusahaan') ||
    getRawValue(raw, 'wira_bidang') ||
    record?.industry ||
    ''
  if (Array.isArray(primary)) {
    return primary.map(normalizeIndustryLabel).filter(Boolean)
  }
  const normalized = normalizeIndustryLabel(primary)
  return normalized ? [normalized] : []
}

const getNumericValue = (record, keys = [], fallbackKeys = []) => {
  const raw = record?.raw || record || {}
  const list = Array.isArray(keys) ? keys : [keys]
  for (const key of list) {
    if (!key) continue
    const val = getRawValue(raw, key)
    if (hasAnswerValue(val)) return toNumber(val)
  }
  const fallbackList = Array.isArray(fallbackKeys) ? fallbackKeys : [fallbackKeys]
  for (const key of fallbackList) {
    if (!key) continue
    const val = record?.[key]
    if (hasAnswerValue(val)) return toNumber(val)
  }
  return null
}

const computeAverageNumber = (records = [], keys = [], fallbackKeys = []) => {
  let total = 0
  let count = 0
  records.forEach((record) => {
    const value = getNumericValue(record, keys, fallbackKeys)
    if (value === null || !Number.isFinite(value)) return
    total += value
    count += 1
  })
  return {
    average: count ? total / count : 0,
    count,
  }
}

const findKeyByLabelKeywords = (keywords = []) => {
  if (!questionFields.value) return null
  const match = questionFields.value.find((q) => {
    const lbl = String(q.label || '').toLowerCase()
    return keywords.some((k) => lbl.includes(k))
  })
  return match ? match.key : null
}



const findValueInAnswers = (answers, keywords) => {
  if (!Array.isArray(answers)) return null
  const match = answers.find((a) => {
    // a.question is likely a string based on API Resource, but handle object just in case
    const qText = typeof a.question === 'object' 
      ? String(a.question?.pertanyaan || a.question?.label || '') 
      : String(a.question || '')
    const lower = qText.toLowerCase()
    return keywords.some((k) => lower.includes(k))
  })
  return match ? match.jawaban : null
}

const mapAlumniRecord = (s) => {
  const submissionAnswers = collectSubmissionAnswers(s)
  // Strategy: Try direct answers array first (most accurate), then standard keys, then dynamic scan.

  // 1. Wait Months - IMPORTANT: Check formData FIRST for specific keys to avoid ambiguous label matching
  let rawWait = null
  
  // Priority 1: Check formData for specific keys (most reliable)
  const formData = s.raw?.formData || s.raw?.form_data || s.formData || s.form_data || {}
  if (formData.bekerja_bulanDapat) {
    rawWait = formData.bekerja_bulanDapat
  } else if (formData.mencari_mulaiSetelah) {
    rawWait = formData.mencari_mulaiSetelah
  } else if (formData.mencari_mulaiSebelum) {
    rawWait = formData.mencari_mulaiSebelum
  }
  
  // Priority 2: Try direct properties
  if (rawWait == null || rawWait === '') {
     rawWait = s.waitMonths || s.bekerja_bulanDapat || s.mencari_mulaiSetelah || s.mencari_mulaiSebelum
  }
  
  // Priority 3: Try answers array (only if still not found)
  if (rawWait == null || rawWait === '') {
    const waitKeywords = ['bulan mendapatkan', 'mendapatkan pekerjaan', 'bulan dapat', 'waktu tunggu', 'masa tunggu', 'lama menunggu', 'waiting', 'dapat kerja', 'first job']
    rawWait = findValueInAnswers(submissionAnswers, waitKeywords)
  }
  
  // Priority 4: Dynamic lookup as last resort
  if (rawWait == null || rawWait === '') {
    const waitKey = findKeyByLabelKeywords(['bulan mendapatkan', 'mendapatkan pekerjaan', 'bulan dapat'])
    if (waitKey) rawWait = getRawValue(s.raw || s, waitKey)
  }
  
  const waitMonths = toNumber(rawWait)

  // 2. Salary
  const salaryKeywords = ['pendapatan', 'gaji', 'wage', 'salary', 'penghasilan', 'income', 'bayaran', 'honor', 'upah']
  let rawSalary = findValueInAnswers(submissionAnswers, salaryKeywords)

  if (rawSalary == null || rawSalary === '') {
    rawSalary = s.salary || s.bekerja_pendapatan
  }

  if (rawSalary == null || rawSalary === '') {
    const salaryKey = findKeyByLabelKeywords(salaryKeywords)
    if (salaryKey) rawSalary = getRawValue(s.raw || s, salaryKey)
  }

  // 3. Industry
  const indKeywords = ['jenis perusahaan', 'bidang usaha', 'sektor', 'industri', 'perusahaan', 'tempat kerja']
  let rawIndustry = findValueInAnswers(submissionAnswers, indKeywords)

  if (!rawIndustry) {
    rawIndustry = s.industry || s.bekerja_jenisPerusahaan || s.wira_jenisPerusahaan || s.wira_bidang
  }

  if (!rawIndustry) {
     const indKey = findKeyByLabelKeywords(indKeywords)
     if (indKey) rawIndustry = getRawValue(s.raw || s, indKey)
  }

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
    salary: normalizeSalaryToJt(rawSalary),
    province: s.province || s.bekerja_provinsi || s.studi_lokasi || '-',
    industry: rawIndustry || 'Lainnya',
    eduFit: s.bekerja_pendidikanSesuai || s.wira_pendidikan || s.eduFit || '-',
    timestamp: s.createdAt || s.timestamp || '',
    attemptNumber,
    attemptLabel: attemptNumber ? `Pengisian ke-${attemptNumber}` : '',
    raw: s.raw || s,
    answers: submissionAnswers,
  }
}

const mapPenggunaRecord = (s) => {
  const submissionAnswers = collectSubmissionAnswers(s)
  return {
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
    answers: submissionAnswers,
  }
}

const mapUmumRecord = (s) => {
  const submissionAnswers = collectSubmissionAnswers(s)
  return {
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
    answers: submissionAnswers,
  }
}



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

const availableFilterOptions = computed(() => {
  if (!filters.questionId) return []
  const question = scopedQuestionFields.value.find(q => q.key === filters.questionId)
  if (!question) return []
  
  if (question.pilihan && Array.isArray(question.pilihan)) return question.pilihan
  if (question.pilihan && typeof question.pilihan === 'string') {
     try {
        return JSON.parse(question.pilihan)
     } catch (e) {
        return question.pilihan.split(',').map(s => s.trim())
     }
  }

  // Fallback: Compute unique values from data
  // Only valid if records exist
  const records = allRecords.value
  const uniqueValues = new Set()
  
  records.forEach(r => {
      const rowVal = getRawValue(r.raw || r, question.key)
      if (Array.isArray(rowVal)) {
          rowVal.forEach(v => { if (v) uniqueValues.add(v) })
      } else if (rowVal) {
          uniqueValues.add(String(rowVal).trim())
      }
  })
  
  return Array.from(uniqueValues).sort()
})

// Watchers to reset downstream filters
watch(() => filters.status, () => {
  filters.questionId = ''
  filters.answerValue = ''
})
watch(() => filters.questionId, () => {
  filters.answerValue = ''
})

const handleUploadClick = () => {
  uploadMessage.value = ''
  uploadError.value = ''
  if (uploadInput.value) {
    uploadInput.value.click()
  }
}

const ensureHeaders = (headers) => {
  // Optional validation
}

const findHeaderIndex = (headers, key) => {
  if (!headers || !key) return -1
  const k = key.toLowerCase()
  return headers.findIndex(h => {
    const hh = String(h || '').trim().toLowerCase()
    return hh === k || hh === k.replace(/_/g, ' ') || hh.includes(k)
  })
}

const isSampleRowArray = (row) => {
  if (!Array.isArray(row)) return false
  const rowStr = row.join(' ').toLowerCase()
  return rowStr.includes('contoh') || rowStr.includes('mawar melati') || rowStr.includes('123456789')
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
    
    // Prioritize 'Template' sheet, otherwise first sheet
    let sheetName = workbook.SheetNames.find(name => name === 'Template')
    if (!sheetName) sheetName = workbook.SheetNames[0]
    
    if (!sheetName) throw new Error('Sheet tidak ditemukan.')
    
    const worksheet = workbook.Sheets[sheetName]
    const rawRows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
    })
    
    if (rawRows.length < 1) throw new Error('File kosong.')
    const headerRow = rawRows[0]
    ensureHeaders(headerRow)
    
    // Check if second row is sample data (contains 'Contoh' or '1901...')
    let dataRows = rawRows.slice(1)
    if (dataRows.length && isSampleRowArray(dataRows[0])) {
      dataRows = dataRows.slice(1)
    }

    // Filter empty rows
    dataRows = dataRows.filter((row) =>
      row.some((cell) => String(cell ?? '').trim().length)
    )
    
    if (!dataRows.length) throw new Error('Tidak ada baris jawaban.')

    if (dataRows.length > 5000) {
      throw new Error(`Data terlalu banyak (${dataRows.length} baris). Maksimal 5000 baris per upload.`)
    }

    const payloads = dataRows.map(row => {
      // Helper to safely get value by header name
      const getValue = (key) => {
        const idx = findHeaderIndex(headerRow, key)
        return idx !== -1 ? row[idx] : ''
      }

      const normalized = {}
      // Map all known 53 columns + dynamic ones
      const headerKeys = headerRow.map(h => String(h||'').trim())
      
      headerKeys.forEach((key, idx) => {
         let val = row[idx]
         if (arrayColumns.includes(key)) {
             if (typeof val === 'string') {
                 val = val.split(';').map(v => v.trim()).filter(Boolean)
             }
             if (!Array.isArray(val)) val = val ? [val] : []
         }
         if (objectColumns.includes(key)) {
             val = parseObjectColumn(val)
         }
         normalized[key] = val
      })

      // Construct payload compatible with addSubmission
      return {
        type: targetType.value,
        audience: questionnaire.value?.audience || 'alumni',
        questionnaire_id: questionnaire.value?.id,
        answers: [],
        
        // Identity
        nama: getValue('nama') || 'Responden',
        nim: String(getValue('nim') || ''),
        nik: String(getValue('nik') || ''),
        email: getValue('email') || '',
        prodi: getValue('prodi') || '',
        fakultas: getValue('fakultas') || '',
        tahun: getValue('tahun') || '',
        status: (getValue('status') || 'belum').toLowerCase(),
        
        // Metrics
        waitMonths: 
            getElementValue(normalized, ['bekerja_bulanDapat', 'bekerja_bulanTidak', 'mencari_mulaiSetelah', 'mencari_mulaiSebelum']) || 0,
        salary: getValue('bekerja_pendapatan') || 0,
        province: getValue('bekerja_provinsi') || getValue('studi_lokasi') || '',
        industry: getValue('bekerja_jenisPerusahaan') || getValue('wira_jenisPerusahaan') || getValue('wira_bidang') || '',
        eduFit: getValue('bekerja_pendidikanSesuai') || getValue('wira_pendidikan') || '',
        
        // Raw data for detailed questions
        raw: { ...normalized },
        form_data: { ...normalized }
      }
    })

    const count = await addSubmissionBatch(payloads)
    uploadMessage.value = `${count} jawaban berhasil diimpor.`
  } catch (err) {
    console.error(err)
    uploadError.value = err?.message || 'Gagal mengimpor berkas.'
  } finally {
    uploadLoading.value = false
    if (uploadInput.value) {
      uploadInput.value.value = ''
    }
  }
}

// Helper for waitMonths extraction
const getElementValue = (obj, keys) => {
    for (const k of keys) {
        if (obj[k]) return obj[k]
    }
    return ''
}

const downloadTemplate = async () => {
  uploadMessage.value = ''
  uploadError.value = ''
  const XLSX = await import('xlsx')
  
  // Fixed headers matching 'template-jawaban-alumni.xlsx'
  const fixedHeaders = [
    'nama', 'nik', 'nim', 'fakultas', 'prodi', 'tahun', 'email', 'status', 'ekstra',
    'bekerja_mulaiSebelum', 'bekerja_mulaiSetelah', 'bekerja_lebihCepat6Bulan', 'bekerja_bulanDapat', 'bekerja_bulanTidak',
    'bekerja_pendapatan', 'bekerja_tingkatTempatKerja', 'bekerja_lokasiDetail', 'bekerja_provinsi', 'bekerja_kabupaten',
    'bekerja_jenisPerusahaan', 'bekerja_namaPerusahaan', 'bekerja_namaPimpinan', 'bekerja_telpPerusahaan', 'bekerja_caraMencari',
    'bekerja_perusahaanLamar', 'bekerja_perusahaanRespon', 'bekerja_perusahaanWawancara', 'bekerja_posisi', 'bekerja_kesesuaianBidang', 'bekerja_pendidikanSesuai',
    'wira_namaPerusahaan', 'wira_telpPerusahaan', 'wira_jenisPerusahaan', 'wira_bidang', 'wira_tingkat', 'wira_kesesuaian', 'wira_pendidikan',
    'studi_lokasi', 'studi_sumberBiaya', 'studi_namaPt', 'studi_prodi', 'studi_tanggalMasuk', 'studi_alasan',
    'mencari_mulaiSebelum', 'mencari_mulaiSetelah', 'mencari_cara', 'mencari_perusahaanLamar', 'mencari_perusahaanRespon', 'mencari_perusahaanWawancara', 'mencari_aktif4Minggu',
    'kompetensi_individu', 'kompetensi_pembelajaran', 'sumberDana'
  ]

  // Sample row matching the headers
  const sampleRow = [
    'Mawar Melati', '1234567890123456', '12345678', 'Sains dan Teknologi', 'Teknik Informatika', '2023', 'mawar@example.com', 'bekerja', 'Masukan untuk kampus...',
    '0', '1', 'Ya', '1', '0', '5000000', 'Nasional', 'Jakarta Selatan', 'DKI Jakarta', 'Jakarta Selatan',
    'Swasta', 'PT Teknologi Maju', 'Budi Santoso', '021-1234567', 'Jobstreet; LinkedIn', '5', '3', '2', 'Software Engineer', 'Sangat Sesuai', 'Setingkat Lebih Tinggi',
    '', '', '', '', '', '', '', // wira defaults
    '', '', '', '', '', '', '', // studi defaults
    '', '', '', '', '', '', '', // mencari defaults
    'Etika:4;Keahlian:5;Bhs Inggris:4;Teknologi Informasi:5;Komunikasi:4;Kerja Sama:5;Pengembangan Diri:5',
    'Perkuliahan:5;Pembimbingan:4;Metode Pengajaran:5;Sarana:4;Integritas:5;Keluasan Ilmu:4;Kesempatan Riset:5',
    'Mandiri'
  ]

  const useDynamicHeaders = isPenggunaAudience.value && templateHeaders.value.length > 0
  const headerRow = useDynamicHeaders
    ? templateHeaders.value.map((header) => String(header ?? '').trim())
    : fixedHeaders
  const sampleRowValues = useDynamicHeaders ? templateSampleRow.value : sampleRow
  const rows = [headerRow, sampleRowValues]
  
  const ws = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Template')
  
  // Optional: Keep Question list if useful, but ensure Template is valid first
  if (templateQuestionListRows.value.length) {
    const questionListRows = [
      ['Kolom', 'Pertanyaan', 'Target audiens', 'Kondisi tampil', 'Catatan'],
      ...templateQuestionListRows.value,
    ]
    const qs = XLSX.utils.aoa_to_sheet(questionListRows)
    XLSX.utils.book_append_sheet(wb, qs, 'Daftar Pertanyaan')
  }
  
  const suffix = questionnaire.value?.audience === 'pengguna' ? 'pengguna' : questionnaire.value?.audience || 'alumni'
  XLSX.writeFile(wb, `template-jawaban-${suffix}.xlsx`)
  uploadMessage.value = 'Template standar berhasil diunduh.'
}

const viewMode = ref('all') // all | latest
const individualSearch = ref('')

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
  allRecords.value.filter((item) => {
    const matchStatus = filters.status.includes('all') || filters.status.includes(item.status)
    const matchProdi = filters.prodi === 'all' || item.prodi === filters.prodi
    const matchFak = filters.fakultas === 'all' || item.fakultas === filters.fakultas
    const matchTahun = filters.tahun === 'all' || String(item.tahun) === filters.tahun

    // Filter by Dynamic Question
    if (filters.questionId && filters.answerValue) {
      const rawVal = getRawValue(item.raw || item, filters.questionId)
      const target = String(filters.answerValue).trim().toLowerCase()
      let match = false
      if (Array.isArray(rawVal)) {
        match = rawVal.some((v) => String(v).trim().toLowerCase() === target)
      } else {
        match = String(rawVal || '').trim().toLowerCase() === target
      }
      if (!match) return false
    }

    return matchStatus && matchProdi && matchFak && matchTahun
  }),
)

const parseIndividualSearch = (value) =>
  String(value || '')
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)

const individualRecords = computed(() => {
  const records = applyViewMode(filteredRecords.value)
  const terms = parseIndividualSearch(individualSearch.value)
  if (!terms.length) return records
  return records.filter((item) => {
    const nama = String(item.nama || '').toLowerCase()
    const nim = String(item.nim || item.raw?.nim || '').toLowerCase()
    if (!nama && !nim) return false
    return terms.some((term) => {
      const needle = term.toLowerCase()
      if (!needle) return false
      if (nim && nim === needle) return true
      return nama.includes(needle) || nim.includes(needle)
    })
  })
})

const summary = computed(() => {
  const data = filteredRecords.value
  const total = data.length
  if (questionnaire.value?.audience === 'pengguna') {
    const topIndustries = buildTopList(data, ['bidang'], 5, ['industry', 'prodi'])
    const topLocations = buildTopList(data, ['lokasi'], 5, ['province', 'fakultas'])
    const topRoles = buildTopList(data, ['peran'], 5)
    const topPositions = buildTopList(data, ['jabatan'], 5)
    const avgRecruitment = computeAverageNumber(data, ['jumlahAlumni'])
    return {
      total,
      topIndustries,
      topLocations,
      topRoles,
      topPositions,
      avgRecruitment,
    }
  }
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

  // Fix: Include 0 values for salary and waitTimes if valid (assuming > -1)
  const salaries = data.map((d) => d.salary).filter((n) => n >= 0).sort((a, b) => a - b)
  const salaryMean = salaries.length ? salaries.reduce((a, b) => a + b, 0) / salaries.length : 0
  const salaryMedian =
    salaries.length === 0
      ? 0
      : salaries.length % 2 === 1
        ? salaries[(salaries.length - 1) / 2]
        : (salaries[salaries.length / 2 - 1] + salaries[salaries.length / 2]) / 2

  const textPool = data.map((d) => d.industry).filter(Boolean)

  // -- New Dashboard Calculations --
  
  // 1. Employment Rate (Bekerja + Wirausaha)
  const workingCount = data.filter(d => ['bekerja', 'wiraswasta'].includes(d.status)).length
  const employmentRate = total ? (workingCount / total) * 100 : 0

  // 2. Waiting Time Analysis
  // Fix: Filter >= 0 instead of > 0
  const waitTimes = data.map((d) => d.waitMonths).filter((n) => n >= 0).sort((a, b) => a - b)
  const waitMean = waitTimes.length ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length : 0
  const waitMedian =
    waitTimes.length === 0
      ? 0
      : waitTimes.length % 2 === 1
        ? waitTimes[(waitTimes.length - 1) / 2]
        : (waitTimes[waitTimes.length / 2 - 1] + waitTimes[waitTimes.length / 2]) / 2

  // 3. Top Industries (jenis perusahaan/instansi alumni bekerja)
  const workingRecords = data.filter((item) => {
    const status = String(item.status || '').toLowerCase()
    return status.startsWith('bekerja') || status.startsWith('wira')
  })
  const industryBuckets = new Map()
  workingRecords.forEach((record) => {
    const labels = extractIndustryLabels(record)
    labels.forEach((label) => {
      const key = label.toLowerCase()
      const current = industryBuckets.get(key) || { group: label, count: 0 }
      current.count += 1
      industryBuckets.set(key, current)
    })
  })
  const industryStats = Array.from(industryBuckets.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((item) => ({
      ...item,
      label: item.group,
      percentage: workingRecords.length ? Math.round((item.count / workingRecords.length) * 100) : 0,
    }))

  return {
    total,
    statusCounts,
    prodiCounts,
    fakultasCounts,
    salaryMean,
    salaryMedian,
    // New Metrics
    employmentRate: Math.round(employmentRate * 10) / 10,
    waitMean: Math.round(waitMean * 10) / 10,
    waitMedian: Math.round(waitMedian * 10) / 10,
    topIndustries: industryStats,
    textPool,
  }
})

const animatedSummary = ref({
  total: 0,
  employmentRate: 0,
  salaryMean: 0,
  waitMedian: 0,
  avgRecruitment: { average: 0, count: 0 },
  statusCounts: [],
  topIndustries: [],
  topLocations: [],
  topRoles: [],
  topPositions: [],
})
const barAnimated = ref(false)
let summaryAnimFrame = null

const lerp = (start, end, t) => start + (end - start) * t
const getItemKey = (item) => String(item?.key ?? item?.label ?? item?.group ?? '')
const buildAnimatedList = (list, startList, countKey) =>
  list.map((item) => {
    const key = getItemKey(item)
    const startItem = startList.find((entry) => getItemKey(entry) === key) || {}
    const startVal = Number(startItem[countKey] || 0)
    const endVal = Number(item[countKey] || 0)
    return {
      ...item,
      [countKey]: startVal,
      __target: endVal,
    }
  })

const animateSummaryValues = (target) => {
  if (!target) return
  if (summaryAnimFrame) cancelAnimationFrame(summaryAnimFrame)
  const start = animatedSummary.value
  const duration = 900
  const startTime = performance.now()
  const targetLists = {
    statusCounts: buildAnimatedList(target.statusCounts || [], start.statusCounts || [], 'value'),
    topIndustries: buildAnimatedList(target.topIndustries || [], start.topIndustries || [], 'count'),
    topLocations: buildAnimatedList(target.topLocations || [], start.topLocations || [], 'count'),
    topRoles: buildAnimatedList(target.topRoles || [], start.topRoles || [], 'count'),
    topPositions: buildAnimatedList(target.topPositions || [], start.topPositions || [], 'count'),
  }

  const step = (now) => {
    const progress = Math.min(1, (now - startTime) / duration)
    const ease = 1 - Math.pow(1 - progress, 3)

    const animateList = (list, countKey) =>
      list.map((item) => ({
        ...item,
        [countKey]: lerp(Number(item[countKey] || 0), Number(item.__target || 0), ease),
      }))

    animatedSummary.value = {
      total: lerp(Number(start.total || 0), Number(target.total || 0), ease),
      employmentRate: lerp(Number(start.employmentRate || 0), Number(target.employmentRate || 0), ease),
      salaryMean: lerp(Number(start.salaryMean || 0), Number(target.salaryMean || 0), ease),
      waitMedian: lerp(Number(start.waitMedian || 0), Number(target.waitMedian || 0), ease),
      avgRecruitment: {
        average: lerp(
          Number(start.avgRecruitment?.average || 0),
          Number(target.avgRecruitment?.average || 0),
          ease,
        ),
        count: lerp(
          Number(start.avgRecruitment?.count || 0),
          Number(target.avgRecruitment?.count || 0),
          ease,
        ),
      },
      statusCounts: animateList(targetLists.statusCounts, 'value'),
      topIndustries: animateList(targetLists.topIndustries, 'count'),
      topLocations: animateList(targetLists.topLocations, 'count'),
      topRoles: animateList(targetLists.topRoles, 'count'),
      topPositions: animateList(targetLists.topPositions, 'count'),
    }

    if (progress < 1) {
      summaryAnimFrame = requestAnimationFrame(step)
    }
  }

  summaryAnimFrame = requestAnimationFrame(step)
}

const summaryAnimated = computed(() => ({
  ...summary.value,
  total: animatedSummary.value.total,
  employmentRate: animatedSummary.value.employmentRate,
  salaryMean: animatedSummary.value.salaryMean,
  waitMedian: animatedSummary.value.waitMedian,
  avgRecruitment: animatedSummary.value.avgRecruitment,
  statusCounts: animatedSummary.value.statusCounts,
  topIndustries: animatedSummary.value.topIndustries,
  topLocations: animatedSummary.value.topLocations,
  topRoles: animatedSummary.value.topRoles,
  topPositions: animatedSummary.value.topPositions,
}))

const triggerBarAnimation = () => {
  barAnimated.value = false
  requestAnimationFrame(() => {
    barAnimated.value = true
  })
}

watch(
  summary,
  (value) => {
    animateSummaryValues(value)
    triggerBarAnimation()
  },
  { immediate: true },
)

const questionBank = computed(() => {
  const base = scopedQuestionFields.value

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

const questionBlocks = computed(() => {
  const baseList = questionBank.value
  const filteredList = filters.selectedQuestions.length > 0 
    ? baseList.filter(q => filters.selectedQuestions.includes(String(q.id)))
    : baseList

  return filteredList.map((q) => {
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
      } else if (typeof rawVal === 'object' && rawVal !== null) {
        Object.entries(rawVal).forEach(([k, v]) => {
          const key = `${k}: ${v}`
          counts[key] = (counts[key] || 0) + 1
        })
      } else if (typeof rawVal === 'string' && rawVal.trim()) {
        if (rawVal.includes(':') && rawVal.includes(';')) {
          // It's a delimited string like 'Etika:5;Keahlian:4'
          const parts = rawVal.split(';').map(p => p.trim()).filter(Boolean)
          parts.forEach(p => {
             counts[p] = (counts[p] || 0) + 1
          })
        } else {
          const key = rawVal.trim()
          counts[key] = (counts[key] || 0) + 1
        }
      }
    })

    const summaryCounts = Object.entries(counts).map(([label, value]) => ({ label, value }))

    return {
      ...q,
      answers,
      counts: summaryCounts,
      total: answers.length,
    }
  })
})

const itemsPerPage = 10
const currentPage = ref(1)

const totalPages = computed(() => Math.ceil(questionBlocks.value.length / itemsPerPage))

const paginatedQuestionBlocks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return questionBlocks.value.slice(start, end)
})

const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  // Scroll to top of questions list
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const answersModal = reactive({
  show: false,
  title: '',
  answers: []
})
const responseDetailById = reactive({})
const responseDetailLoading = ref(false)

const openAnswersModal = (block) => {
  answersModal.title = block.label
  answersModal.answers = block.answers
  answersModal.show = true
}

const currentResponseAnswers = computed(() => {
  if (!currentResponse.value) return []

  const detailSource = responseDetailById[currentResponse.value.id] || null
  const source = detailSource || currentResponse.value
  const answerRecords = collectSubmissionAnswers(source)
  const labelByQuestionId = new Map(
    questionBank.value
      .map((q) => [normalizeQuestionId(q.id), q.label || formatFriendlyLabel(q.key || q.id)])
      .filter(([id, label]) => id && label),
  )
  const allowedQuestionIds = new Set(
    scopedQuestionFields.value
      .map((q) => normalizeQuestionId(q.id))
      .filter(Boolean),
  )
  const enforceScopedIds = hasQuestionnaireQuestions.value && allowedQuestionIds.size > 0

  let answers = []
  if (answerRecords.length) {
    answers = answerRecords.map((ans) => {
      const normalizedQuestionId = normalizeQuestionId(
        ans.question_id ?? ans.questionId ?? ans.id ?? ans.key,
      )
      // 1. Look up label from questionBank by ID
      let qFound = questionBank.value.find(
        (q) => normalizeQuestionId(q.id) === normalizedQuestionId,
      )
      
      // 2. Fallback: Search by label if the current label is numeric or missing
      const questionValue = ans.question ?? ''
      const isNumericLabel = typeof questionValue === 'string' && /^\d+$/.test(String(questionValue).trim())
      
      if ((!qFound || /^\d+$/.test(qFound.label)) && isNumericLabel) {
        // Try to find in bank by matching the ID string (in case q.id or q.key matches)
        const targetId = normalizeQuestionId(questionValue)
        qFound = questionBank.value.find(q => 
          (normalizeQuestionId(q.id) === targetId || normalizeQuestionId(q.key) === targetId) && !/^\d+$/.test(q.label)
        )
      }

      let label =
        (qFound && !/^\d+$/.test(qFound.label) ? qFound.label : null) ||
        (normalizedQuestionId ? labelByQuestionId.get(normalizedQuestionId) : null) ||
        (!isNumericLabel && typeof questionValue === 'string' && questionValue.trim() ? questionValue.trim() : null) ||
        (() => {
          const text = extractQuestionTextFromAnswer(ans)
          return text && !/^\d+$/.test(String(text).trim()) ? String(text).trim() : null
        })() ||
        `Pertanyaan #${ans.question_id || ans.id}`
      
      // Final attempt: if it's still numeric, maybe the bank question label is better
      if (/^\d+$/.test(label) && qFound?.label) {
          label = qFound.label
      }

      const rawValue = ans.jawaban ?? ans.answer ?? ans.response ?? ans.value ?? ''
      const value = formatAnswerValue(rawValue)
      return {
        id: normalizedQuestionId || String(ans.question_id ?? ans.questionId ?? ans.id ?? ''),
        label,
        answer: value,
      }
    })
    if (enforceScopedIds) {
      answers = answers.filter((item) =>
        !normalizeQuestionId(item.id) || allowedQuestionIds.has(normalizeQuestionId(item.id)),
      )
    }
  } else {
    const raw = currentResponse.value.raw || {}
    answers = questionBank.value
      .map((q) => {
        // Always include questions if there's a stored value
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
  }

  const rawEntries = flattenRawAnswers(source)
  const questionKeyMap = questionBank.value.reduce((acc, q) => {
    if (q.key) {
      acc[q.key] = q.label || q.id || formatFriendlyLabel(q.key)
    }
    const normalizedId = normalizeQuestionId(q.id)
    if (normalizedId) {
      acc[normalizedId] = q.label || q.id || formatFriendlyLabel(q.key || q.id)
    }
    return acc
  }, {})

  const seenLabels = new Set(answers.map((ans) => String(ans.label || '').toLowerCase().trim()))
  const seenIds = new Set(answers.map((ans) => normalizeQuestionId(ans.id)))

  rawEntries.forEach(([rawKey, value]) => {
    const key = String(rawKey ?? '').trim()
    if (!key) return
    const normalizedKey = normalizeQuestionId(key)
    let label = (
      questionKeyMap[key] ||
      questionKeyMap[normalizedKey] ||
      (normalizedKey && labelByQuestionId.get(normalizedKey)) ||
      formatFriendlyLabel(key)
    ).trim()
    if (normalizedKey === 'ekstra' || normalizedKey === 'extra') {
      label = 'Masukan/Saran untuk Pengembangan Kurikulum'
    }
    const normalizedLabel = label.toLowerCase()
    
    if (seenIds.has(normalizedKey) || seenLabels.has(normalizedLabel)) {
      return
    }

    seenLabels.add(normalizedLabel)
    seenIds.add(normalizedKey)
    
    answers.push({
      id: normalizedKey || `form-data-${key}`,
      label,
      answer: formatAnswerValue(value),
    })
  })

  const orderedQuestions = (
    hasQuestionnaireQuestions.value ? scopedQuestionFields.value : questionBank.value
  ) || []
  const orderById = new Map()
  const orderByLabel = new Map()

  orderedQuestions.forEach((q, index) => {
    const id = normalizeQuestionId(q.id)
    const key = normalizeQuestionId(q.key)
    const label = String(q.label || '').toLowerCase().trim()
    if (id && !orderById.has(id)) orderById.set(id, index)
    if (key && !orderById.has(key)) orderById.set(key, index)
    if (label && !orderByLabel.has(label)) orderByLabel.set(label, index)
  })

  const resolveOrder = (item, fallbackIndex) => {
    const rawId = String(item?.id ?? '').trim()
    const id = normalizeQuestionId(rawId.replace(/^form-data-/i, ''))
    const label = String(item?.label || '').toLowerCase().trim()
    const isExtraAnswer =
      id === 'ekstra' ||
      id === 'extra' ||
      label === 'ekstra' ||
      label === 'extra' ||
      label.includes('masukan/saran untuk pengembangan kurikulum')

    if (isExtraAnswer) {
      return Number.MAX_SAFE_INTEGER - 1
    }

    if (id && orderById.has(id)) return orderById.get(id)
    if (label && orderByLabel.has(label)) return orderByLabel.get(label)
    return orderedQuestions.length + fallbackIndex
  }

  return answers
    .map((item, index) => ({
      ...item,
      __index: index,
      __order: resolveOrder(item, index),
    }))
    .sort((a, b) => (a.__order === b.__order ? a.__index - b.__index : a.__order - b.__order))
    .map(({ __index, __order, ...rest }) => rest)
})

const tabItems = ['summary', 'questions', 'individual']
const tab = ref('summary')
const tabContainerRef = ref(null)
const tabRefs = ref([])
const tabIndicator = reactive({ left: 0, top: 0, width: 0, height: 0 })

const setTabRef = (el, index) => {
  if (el) tabRefs.value[index] = el
}

const updateTabIndicator = () => {
  nextTick(() => {
    const index = tabItems.indexOf(tab.value)
    const tabEl = tabRefs.value[index]
    if (!tabContainerRef.value || !tabEl) return
    const containerRect = tabContainerRef.value.getBoundingClientRect()
    const tabRect = tabEl.getBoundingClientRect()
    tabIndicator.left = tabRect.left - containerRect.left
    tabIndicator.top = tabRect.top - containerRect.top
    tabIndicator.width = tabRect.width
    tabIndicator.height = tabRect.height
  })
}
const currentResponseIndex = ref(0)
const deleting = ref(false)
const deleteError = ref('')
const printingPdf = ref(false)

const currentResponse = computed(() => individualRecords.value[currentResponseIndex.value] || null)

const ensureResponseDetail = async (responseId) => {
  const id = String(responseId ?? '').trim()
  if (!id || responseDetailById[id]) return
  responseDetailLoading.value = true
  try {
    const resp = await tracerService.getSubmissionById(id)
    const payload = resp?.data && typeof resp.data === 'object' ? resp.data : resp
    responseDetailById[id] = payload && typeof payload === 'object' ? payload : null
  } catch (err) {
    responseDetailById[id] = null
  } finally {
    responseDetailLoading.value = false
  }
}

watch(
  () => individualRecords.value.length,
  (len) => {
    if (currentResponseIndex.value >= len) {
      currentResponseIndex.value = Math.max(0, len - 1)
    }
  },
)

watch(
  () => individualSearch.value,
  (next, prev) => {
    if (next !== prev) {
      currentResponseIndex.value = 0
    }
  },
)

watch(
  () => tab.value,
  () => {
    updateTabIndicator()
  },
)

watch(
  () => currentResponse.value?.id,
  (id) => {
    if (!id) return
    ensureResponseDetail(id)
  },
  { immediate: true },
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
    tahun: Array.from(new Set(allRecords.value.map((d) => d.tahun).filter(Boolean))).map(String).sort((a,b) => b - a),
    fakultas: Array.from(new Set(allRecords.value.map((d) => d.fakultas).filter(Boolean))).sort(),
    prodi: Array.from(new Set(allRecords.value.map((d) => d.prodi).filter(Boolean))).sort(),
}))

const exportFilteredData = (format = 'xlsx') => {
  const records = filteredRecords.value
  if (!records.length) {
    window.alert('Tidak ada data untuk diekspor dengan filter saat ini.')
    return
  }

  const questions = questionBank.value
  
  // Header: Standard Fields + Question Labels
  const standardHeaders = ['Nama', 'NIM', 'Fakultas', 'Prodi', 'Tahun Lulus', 'Status', 'Timestamp']
  const questionHeaders = questions.map(q => q.label)
  const header = [...standardHeaders, ...questionHeaders]

  const rows = records.map(resp => {
    const raw = resp.raw || {}
    
    // Standard Values
    const row = [
      resp.nama,
      resp.nim,
      resp.fakultas,
      resp.prodi,
      resp.tahun,
      resp.status,
      resp.timestamp ? new Date(resp.timestamp).toLocaleString('id-ID') : '-'
    ]

    // Question Values
    questions.forEach(q => {
      const val = getRawValue(raw, q.key)
      row.push(q.formatter ? q.formatter(val) : formatAnswerValue(val))
    })

    return row
  })

  const aoa = [header, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Responses_Filtered')

  const fileName = `responses_terfilter_${questionnaireId.value}_${new Date().getTime()}.${format}`
  if (format === 'csv') {
    XLSX.writeFile(wb, fileName, { bookType: 'csv' })
  } else {
    XLSX.writeFile(wb, fileName)
  }
}

const exportAllPdf = () => {
  window.alert('Export PDF belum diimplementasikan di prototipe ini.')
}

const loadLogoDataUrl = async () => {
  if (logoDataUrl.value) return logoDataUrl.value
  try {
    const response = await fetch(logoAssetUrl)
    if (!response.ok) return null
    const blob = await response.blob()
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Bentuk logo tidak valid'))
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    logoDataUrl.value = dataUrl
    return dataUrl
  } catch (err) {
    console.error('Tidak bisa memuat logo UIN', err)
    return null
  }
}

const printCurrentResponsePdf = async () => {
  if (!currentResponse.value) return
  printingPdf.value = true
  try {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 45
    const contentWidth = pageWidth - margin * 2
    let y = margin

    // ─── Helpers ───────────────────────────────────────────────
    const ensureSpace = (needed = 0) => {
      if (y + needed > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
    }

    const drawDivider = (thickness = 0.5, color = [180, 180, 180]) => {
      doc.setDrawColor(...color)
      doc.setLineWidth(thickness)
      doc.line(margin, y, pageWidth - margin, y)
    }

    // ─── KOP SURAT ────────────────────────────────────────────────
    // Metrik teks
    const kopBoldSize = 12   // Sedikit diperbesar dari 11
    const kopSmallSize = 8.5 // Sedikit diperbesar dari 8
    const boldLineH   = 15   // Jarak baris nama instansi
    const smallLineH  = 12   // Jarak baris alamat
    const headerPadV  = 15   // Padding atas & bawah blok kop
    const addrGap     = 10   // Jarak antara nama instansi dan alamat

    const nBoldLines = letterHeadContent.mainLines.length // 3
    const textBlockH = headerPadV
      + nBoldLines * boldLineH
      + addrGap
      + smallLineH * 2
      + headerPadV
    // textBlockH ≈ 15 + 45 + 10 + 24 + 15 = 109pt

    // ── Load logo: scale dari lebar maks (110pt), lalu clamp tinggi ke textBlockH ──
    const LOGO_MAX_W = 110
    let logoData = null
    try {
      const rawUrl = await loadLogoDataUrl()
      if (rawUrl) {
        logoData = await new Promise((res) => {
          const img = new Image()
          img.onload = () => {
            // Coba scale dari lebar = LOGO_MAX_W
            let dW = LOGO_MAX_W
            let dH = Math.round(img.height * (LOGO_MAX_W / img.width))

            // Jika hasilnya LEBIH TINGGI dari textBlockH → scale dari tinggi
            if (dH > Math.round(textBlockH)) {
              dH = Math.round(textBlockH)
              dW = Math.round(img.width * (dH / img.height))
            }

            // Canvas 3× HiDPI → ketajaman gambar
            const DPR = 3
            const cvs = document.createElement('canvas')
            cvs.width  = dW * DPR
            cvs.height = dH * DPR
            const ctx = cvs.getContext('2d')
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, cvs.width, cvs.height)
            ctx.drawImage(img, 0, 0, cvs.width, cvs.height)
            res({ dataUrl: cvs.toDataURL('image/jpeg', 0.95), w: dW, h: dH })
          }
          img.onerror = () => res(null)
          img.src = rawUrl
        })
      }
    } catch (_) { /* logo optional */ }

    // ── Render logo: center vertikal dalam textBlockH ──
    const logoW   = logoData ? logoData.w : 0
    const logoH   = logoData ? logoData.h : 0
    const logoGap = logoData ? 15 : 0
    if (logoData) {
      const logoTopY = y + (textBlockH - logoH) / 2 // Rata tengah vertikal
      doc.addImage(logoData.dataUrl, 'JPEG', margin, logoTopY, logoW, logoH)
    }

    // ── Kolom teks ──
    const textColX = margin + logoW + logoGap
    const textColW = contentWidth - logoW - logoGap
    const textCX   = textColX + textColW / 2

    // Tinggi konten teks
    const textContentH = nBoldLines * boldLineH + addrGap + smallLineH * 2
    // Center teks vertikal dalam textBlockH
    let ty = y + (textBlockH - textContentH) / 2 + kopBoldSize

    // 3 baris bold (instansi)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(kopBoldSize)
    doc.setTextColor(0, 0, 0)
    letterHeadContent.mainLines.forEach((line) => {
      doc.text(line, textCX, ty, { align: 'center' })
      ty += boldLineH
    })

    // Gap dan alamat
    ty += addrGap
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(kopSmallSize)
    doc.setTextColor(50, 50, 50)
    doc.text(letterHeadContent.addressLine, textCX, ty, { align: 'center' })
    ty += smallLineH
    doc.text(letterHeadContent.contactLine, textCX, ty, { align: 'center' })

    y += textBlockH + 5

    // ── Garis penutup kop (double: tebal + tipis) ──
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(2)
    doc.line(margin, y, pageWidth - margin, y)
    doc.setLineWidth(0.5)
    doc.line(margin, y + 4, pageWidth - margin, y + 4)
    y += 10 // Pindahkan y lebih jauh setelah garis

    // ─── JUDUL DOKUMEN ────────────────────────────────────────
    y += 30   // Jarak lebih jauh ke bawah untuk judul dokumen
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13) // Judul sedikit diperbesar
    doc.setTextColor(0, 0, 0)
    doc.text('REKAP JAWABAN KUISIONER', pageWidth / 2, y, { align: 'center' })
    y += 12
    const qTitle = questionnaire.value?.title || questionnaire.value?.judul || ''
    if (qTitle) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(80, 80, 80)
      doc.text(qTitle, pageWidth / 2, y, { align: 'center' })
      y += 15
    }
    y += 15   // Spasi sebelum blok info responden
    doc.setTextColor(0, 0, 0)

    // ─── INFO RESPONDEN ────────────────────────────────────────
    const infoRows = [
      ['Nama', currentResponse.value.nama || '-'],
      ['NIM', currentResponse.value.nim || '-'],
      ['Fakultas', currentResponse.value.fakultas || '-'],
      ['Program Studi', currentResponse.value.prodi || '-'],
      ['Status', currentResponse.value.status || '-'],
      ['Tanggal Isi', currentResponse.value.timestamp
        ? new Date(currentResponse.value.timestamp).toLocaleString('id-ID')
        : '-'],
    ]

    const colLabelW = 100
    const colValueX = margin + colLabelW + 10
    const rowH = 15

    // Background info box
    doc.setFillColor(245, 247, 250)
    doc.roundedRect(margin - 4, y - 8, contentWidth + 8, infoRows.length * rowH + 12, 3, 3, 'F')
    doc.setDrawColor(200, 210, 230)
    doc.setLineWidth(0.5)
    doc.roundedRect(margin - 4, y - 8, contentWidth + 8, infoRows.length * rowH + 12, 3, 3, 'S')

    infoRows.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(60, 60, 60)
      doc.text(label, margin, y)
      doc.setFont('helvetica', 'normal')
      doc.text(':', margin + colLabelW, y)
      doc.setTextColor(20, 20, 20)
      const wrapped = doc.splitTextToSize(String(value), contentWidth - colLabelW - 16)
      doc.text(wrapped[0] || '-', colValueX, y)
      wrapped.slice(1).forEach((ln) => { y += 11; doc.text(ln, colValueX, y) })
      y += rowH
    })
    y += 10

    // ─── SECTION HEADER: JAWABAN ───────────────────────────────
    doc.setFillColor(30, 58, 138)
    doc.roundedRect(margin - 4, y - 9, contentWidth + 8, 17, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(255, 255, 255)
    doc.text('JAWABAN KUISIONER', margin + 4, y + 2)
    doc.setTextColor(0, 0, 0)
    y += 16

    const printableAnswers = currentResponseAnswers.value || []
    if (!printableAnswers.length) {
      ensureSpace(20)
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      doc.setTextColor(120, 120, 120)
      doc.text('Belum ada jawaban terisi.', margin, y)
      doc.setTextColor(0, 0, 0)
      y += 20
    } else {
      printableAnswers.forEach((item, idx) => {
        const label = item.label || 'Pertanyaan'
        const answerText = item.answer || '-'
        const labelLines = doc.splitTextToSize(`${idx + 1}. ${label}`, contentWidth)
        const answerLines = doc.splitTextToSize(answerText, contentWidth - 12)
        const blockH = labelLines.length * 11 + answerLines.length * 11 + 16

        ensureSpace(blockH + 6)

        // Zebra stripe (baris genap)
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 253)
          doc.rect(margin - 4, y - 8, contentWidth + 8, blockH, 'F')
        }

        // Label pertanyaan
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8.5)
        doc.setTextColor(30, 58, 138)
        labelLines.forEach((ln) => {
          doc.text(ln, margin, y)
          y += 11
        })

        // Jawaban
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(30, 30, 30)
        answerLines.forEach((ln) => {
          doc.text(ln, margin + 12, y)
          y += 11
        })

        y += 6

        // Separator tipis
        if (idx < printableAnswers.length - 1) {
          drawDivider(0.3, [210, 215, 225])
          y += 4
        }
      })
    }

    // ─── FOOTER setiap halaman ────────────────────────────────
    const totalPages = doc.internal.getNumberOfPages()
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p)
      const footerY = pageHeight - 20
      doc.setDrawColor(180, 180, 180)
      doc.setLineWidth(0.3)
      doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(150, 150, 150)
      doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, margin, footerY)
      doc.text(`Halaman ${p} / ${totalPages}`, pageWidth - margin, footerY, { align: 'right' })
    }

    const safeName = (currentResponse.value.nama || 'jawaban').replace(/[\\/:*?"<>|]/g, '_')
    doc.save(`${safeName}_jawaban.pdf`)
  } catch (err) {
    console.error('Gagal mencetak PDF', err)
    window.alert('Gagal membuat PDF jawaban.')
  } finally {
    printingPdf.value = false
  }
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
    await fetchSubmissions({
      questionnaireId: questionnaire.value.id,
      limit: MAX_RESPONSE_LIMIT,
      per_page: MAX_RESPONSE_LIMIT,
      all: 1,
      include_answers: 1,
    })
  }
}

const handleOutsideClick = () => {
  if (openFilter.value) {
    openFilter.value = null
  }
}

onMounted(() => {
  loadData()
  window.addEventListener('click', handleOutsideClick)
  updateTabIndicator()
  window.addEventListener('resize', updateTabIndicator)
})

onUnmounted(() => {
  window.removeEventListener('click', handleOutsideClick)
  window.removeEventListener('resize', updateTabIndicator)
  if (summaryAnimFrame) cancelAnimationFrame(summaryAnimFrame)
})
</script>

<template>
  <AdminShell>
    <div class="max-w-6xl px-4 py-6 sm:px-6 lg:px-10">
      <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Kuisioner</p>
          <h1 class="mt-1 text-2xl font-semibold text-slate-900">Lihat jawaban</h1>
          
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
            @click="exportFilteredData('csv')"
          >
            Export CSV (Terfilter)
          </button>
          <button
            type="button"
            class="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
            @click="exportFilteredData('xlsx')"
          >
            Export Excel (Terfilter)
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
      

      <!-- Navigation Tabs -->
      <div
        ref="tabContainerRef"
        class="relative mb-4 inline-flex flex-wrap items-center gap-1 rounded-full bg-slate-100/80 p-1 shadow-sm"
      >
        <span
          aria-hidden="true"
          class="pointer-events-none absolute left-0 top-0 rounded-full bg-white shadow-sm ring-1 ring-slate-200 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          :style="{
            width: tabIndicator.width + 'px',
            height: tabIndicator.height + 'px',
            transform: `translate(${tabIndicator.left}px, ${tabIndicator.top}px)`,
            opacity: tabIndicator.width ? 0.95 : 0,
            filter: tabIndicator.width ? 'blur(0.4px)' : 'blur(0px)',
          }"
        ></span>
        <button
          v-for="(item, index) in tabItems"
          :key="item"
          type="button"
          :ref="(el) => setTabRef(el, index)"
          class="relative z-10 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-200 ease-out"
          :class="tab === item ? 'text-slate-900' : 'text-slate-500 hover:bg-white/70 hover:text-slate-900'"
          @click="tab = item"
        >
          {{ item === 'summary' ? 'Ringkasan' : item === 'questions' ? 'Per-pertanyaan' : 'Jawaban individu' }}
        </button>
      </div>

      <!-- Filters Row (Single Line) -->
      <div class="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 shadow-sm">
        <div class="flex items-center gap-2">
          <svg class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">Filter:</span>
        </div>

        <!-- Standard Filters -->
        <template v-if="!isPenggunaAudience">
          <select v-model="filters.tahun" class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition shadow-sm">
            <option value="all">Semua tahun</option>
            <option v-for="t in uniqueFilters.tahun" :key="t" :value="t">{{ t }}</option>
          </select>
          <select v-model="filters.fakultas" class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition shadow-sm">
            <option value="all">Semua fakultas</option>
            <option v-for="f in uniqueFilters.fakultas" :key="f" :value="f">{{ f }}</option>
          </select>
          <select v-model="filters.prodi" class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition shadow-sm">
            <option value="all">Semua prodi</option>
            <option v-for="p in uniqueFilters.prodi" :key="p" :value="p">{{ p }}</option>
          </select>
        </template>
        <!-- Status Multi-select -->
        <div class="relative">
          <button 
            type="button"
            @click.stop="toggleFilter('status')"
            class="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 min-w-[130px]"
          >
            <span class="truncate">{{ filters.status.includes('all') ? 'Semua status' : filters.status.length + ' Status terpilih' }}</span>
            <svg class="h-3 w-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div v-if="openFilter === 'status'" @click.stop class="absolute left-0 top-full z-[80] mt-1 w-56 rounded-xl border border-slate-100 bg-white p-2 shadow-xl ring-1 ring-black ring-opacity-5">
            <label class="flex items-center gap-2 rounded-lg p-2 hover:bg-slate-50 transition cursor-pointer">
              <input type="checkbox" :checked="filters.status.includes('all')" @change="toggleStatus('all')" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500">
              <span class="text-xs font-medium text-slate-700">Semua status</span>
            </label>
            <div class="h-px bg-slate-100 my-1"></div>
            <div class="max-h-48 overflow-y-auto custom-scrollbar">
              <label v-for="opt in statusOptions" :key="opt.value" class="flex items-center gap-2 rounded-lg p-2 hover:bg-slate-50 transition cursor-pointer">
                <input type="checkbox" :checked="filters.status.includes(opt.value)" @change="toggleStatus(opt.value)" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500">
                <span class="text-xs text-slate-600">{{ opt.label }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Questions Multi-select (Visible on Questions tab) -->
        <div v-if="tab === 'questions'" class="relative">
          <button 
            type="button"
            @click.stop="toggleFilter('questions')"
            class="flex items-center justify-between gap-2 rounded-lg border border-indigo-100 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 min-w-[160px]"
          >
            <span class="truncate">{{ filters.selectedQuestions.length === 0 ? 'Semua Pertanyaan' : filters.selectedQuestions.length + ' Pertanyaan' }}</span>
            <svg class="h-3 w-3 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div v-if="openFilter === 'questions'" @click.stop class="absolute left-0 top-full z-[80] mt-1 w-80 rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl ring-1 ring-black ring-opacity-5">
            <div class="flex items-center justify-between p-2 mb-1 border-b border-slate-50">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pilih Pertanyaan ({{ questionBank.length }})</span>
              <button type="button" v-if="filters.selectedQuestions.length > 0" @click="filters.selectedQuestions = []" class="text-[10px] text-indigo-600 font-bold hover:underline">Reset</button>
            </div>
            <div class="max-h-80 overflow-y-auto custom-scrollbar p-1">
              <label v-for="q in questionBank" :key="q.id" class="flex items-start gap-2 rounded-xl p-2 hover:bg-indigo-50/50 transition cursor-pointer group">
                <input type="checkbox" :checked="filters.selectedQuestions.includes(String(q.id))" @change="toggleQuestion(String(q.id))" class="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500">
                <span class="text-[11px] text-slate-600 leading-tight group-hover:text-slate-900">{{ q.label }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Dynamic Advanced Filters (Inline) -->
        <template v-if="availableFilterQuestions.length">
          <div class="h-6 w-px bg-slate-200 mx-1"></div>
          
          <select v-model="filters.questionId" class="max-w-[200px] rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition shadow-sm">
            <option value="">-- Pertanyaan Lanjutan --</option>
            <option v-for="q in availableFilterQuestions" :key="q.key" :value="q.key">
              {{ q.label && q.label.length > 40 ? q.label.substring(0, 40) + '...' : q.label }}
            </option>
          </select>

          <select 
            v-if="filters.questionId"
            v-model="filters.answerValue" 
            class="max-w-[150px] rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition shadow-sm"
          >
            <option value="">-- Jawaban --</option>
            <option v-for="opt in availableFilterOptions" :key="opt" :value="opt">
              {{ opt }}
            </option>
          </select>

          <button 
            v-if="filters.questionId" 
            @click="filters.questionId = ''; filters.answerValue = ''"
            class="rounded-full p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
            title="Hapus filter lanjutan"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </template>
      </div>

      <section v-if="tab === 'summary'" class="space-y-6">
        <template v-if="isPenggunaAudience">
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p class="text-xs font-medium text-slate-500">Total Responden</p>
                  <p class="text-2xl font-bold text-slate-900">{{ Math.round(summaryAnimated.total || 0) }}</p>
                </div>
              </div>
            </div>
            <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.966a1 1 0 00.95.69h4.174c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.921-.755 1.688-1.538 1.118l-3.38-2.455a1 1 0 00-1.176 0l-3.38 2.455c-.783.57-1.838-.197-1.538-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.049 9.393c-.783-.57-.38-1.81.588-1.81h4.174a1 1 0 00.95-.69l1.286-3.966z" />
                  </svg>
                </div>
                <div>
                  <p class="text-xs font-medium text-slate-500">Top Bidang Industri</p>
                  <p class="text-lg font-bold text-slate-900">{{ summaryAnimated.topIndustries?.[0]?.label || summaryAnimated.topIndustries?.[0]?.group || '-' }}</p>
                  <p class="text-[11px] text-slate-400">{{ Math.round(summaryAnimated.topIndustries?.[0]?.count || 0) }} respon</p>
                </div>
              </div>
            </div>
            <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 12.414a4 4 0 10-5.657 5.657l4.243 4.243a8 8 0 0011.314-11.314z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p class="text-xs font-medium text-slate-500">Top Lokasi</p>
                  <p class="text-lg font-bold text-slate-900">{{ summaryAnimated.topLocations?.[0]?.label || '-' }}</p>
                  <p class="text-[11px] text-slate-400">{{ Math.round(summaryAnimated.topLocations?.[0]?.count || 0) }} respon</p>
                </div>
              </div>
            </div>
            <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p class="text-xs font-medium text-slate-500">Rerata Alumni Direkrut</p>
                  <p class="text-2xl font-bold text-slate-900">{{ summaryAnimated.avgRecruitment?.average?.toFixed(1) || 0 }}</p>
                  <p class="text-[11px] text-slate-400">dari {{ Math.round(summaryAnimated.avgRecruitment?.count || 0) }} responden</p>
                </div>
              </div>
            </div>
          </div>

          <div class="grid gap-6 lg:grid-cols-3">
            <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 class="mb-4 text-sm font-bold text-slate-800">Top Bidang Industri</h3>
              <div v-if="summaryAnimated.topIndustries?.length" class="space-y-3">
                <div
                  v-for="(item, idx) in summaryAnimated.topIndustries"
                  :key="item.label || item.group"
                  class="flex items-center gap-3"
                >
                  <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                    {{ idx + 1 }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="truncate text-xs font-medium text-slate-700">{{ item.label || item.group }}</p>
                    <div class="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                      <div
                        class="h-full rounded-full bg-slate-400 transition-all duration-700 ease-out"
                        :style="{ width: barAnimated ? `${(item.count / Math.max(1, summaryAnimated.topIndustries[0].count || 1)) * 100}%` : '0%' }"
                      />
                    </div>
                  </div>
                  <span class="text-xs font-bold text-slate-900">{{ Math.round(item.count || 0) }}</span>
                </div>
              </div>
              <p v-else class="text-sm text-slate-500 italic">Belum ada data bidang.</p>
            </div>

            <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 class="mb-4 text-sm font-bold text-slate-800">Top Lokasi</h3>
              <div v-if="summaryAnimated.topLocations?.length" class="space-y-3">
                <div
                  v-for="(item, idx) in summaryAnimated.topLocations"
                  :key="item.label"
                  class="flex items-center gap-3"
                >
                  <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                    {{ idx + 1 }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="truncate text-xs font-medium text-slate-700">{{ item.label }}</p>
                    <div class="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                      <div
                        class="h-full rounded-full bg-slate-400 transition-all duration-700 ease-out"
                        :style="{ width: barAnimated ? `${(item.count / Math.max(1, summaryAnimated.topLocations[0].count || 1)) * 100}%` : '0%' }"
                      />
                    </div>
                  </div>
                  <span class="text-xs font-bold text-slate-900">{{ Math.round(item.count || 0) }}</span>
                </div>
              </div>
              <p v-else class="text-sm text-slate-500 italic">Belum ada data lokasi.</p>
            </div>

            <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 class="mb-4 text-sm font-bold text-slate-800">Top Peran Dibutuhkan</h3>
              <div v-if="summaryAnimated.topRoles?.length" class="space-y-3">
                <div
                  v-for="(item, idx) in summaryAnimated.topRoles"
                  :key="item.label"
                  class="flex items-center gap-3"
                >
                  <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                    {{ idx + 1 }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="truncate text-xs font-medium text-slate-700">{{ item.label }}</p>
                    <div class="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                      <div
                        class="h-full rounded-full bg-slate-400 transition-all duration-700 ease-out"
                        :style="{ width: barAnimated ? `${(item.count / Math.max(1, summaryAnimated.topRoles[0].count || 1)) * 100}%` : '0%' }"
                      />
                    </div>
                  </div>
                  <span class="text-xs font-bold text-slate-900">{{ Math.round(item.count || 0) }}</span>
                </div>
              </div>
              <p v-else class="text-sm text-slate-500 italic">Belum ada data peran.</p>
            </div>
          </div>
        </template>
        <template v-else>
        <!-- Key Metrics Grid -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Total Responses -->
          <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p class="text-xs font-medium text-slate-500">Total Respon</p>
                <p class="text-2xl font-bold text-slate-900">{{ Math.round(summaryAnimated.total || 0) }}</p>
              </div>
            </div>
          </div>

          <!-- Employment Rate -->
          <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p class="text-xs font-medium text-slate-500">Sudah Bekerja/Wirausaha</p>
                <div class="flex items-baseline gap-1">
                  <p class="text-2xl font-bold text-slate-900">{{ summaryAnimated.employmentRate?.toFixed(1) || 0 }}%</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Avg Salary -->
          <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p class="text-xs font-medium text-slate-500">Rerata Gaji (Mean)</p>
                <p class="text-2xl font-bold text-slate-900">Rp {{ summaryAnimated.salaryMean?.toFixed(1) || 0 }} Jt</p>
              </div>
            </div>
          </div>

          <!-- Wait Time -->
          <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p class="text-xs font-medium text-slate-500">Rerata Masa Tunggu</p>
                <p class="text-2xl font-bold text-slate-900">{{ summaryAnimated.waitMedian?.toFixed(1) || 0 }} Bulan</p>
                <p class="text-[10px] text-slate-400">Median dari data valid</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Detailed Charts Grid -->
        <div class="grid gap-6 lg:grid-cols-3">
          <!-- Status Distribution (Merged 2 cols) -->
          <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
            <h3 class="mb-4 text-sm font-bold text-slate-800">Distribusi Status Alumni</h3>
            <div v-if="summaryAnimated.statusCounts.length" class="space-y-4">
              <div v-for="item in summaryAnimated.statusCounts" :key="item.key">
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="font-medium text-slate-700">{{ item.label }}</span>
                  <span class="text-slate-500">
                    {{ Math.round(item.value || 0) }}
                    ({{ summaryAnimated.total ? ((item.value / summaryAnimated.total) * 100).toFixed(1) : 0 }}%)
                  </span>
                </div>
                <div class="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="h-full rounded-full transition-all duration-700 ease-out"
                    :class="{
                      'bg-emerald-500': ['bekerja', 'wiraswasta'].includes(item.key),
                      'bg-amber-500': ['mencari', 'belum'].includes(item.key),
                      'bg-indigo-500': ['melanjutkan'].includes(item.key)
                    }"
                    :style="{ width: barAnimated ? `${summaryAnimated.total ? (item.value / summaryAnimated.total) * 100 : 0}%` : '0%' }"
                  />
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-slate-500 italic">Tidak ada data untuk ditampilkan.</p>
          </div>

          <!-- Top Industries -->
          <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 class="mb-4 text-sm font-bold text-slate-800">Top 5 Industri</h3>
            <div v-if="summaryAnimated.topIndustries?.length" class="space-y-3">
                <div 
                  v-for="(ind, idx) in summaryAnimated.topIndustries"
                  :key="ind.group || ind.label"
                  class="flex items-center gap-3"
                >
                <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                  {{ idx + 1 }}
                </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1">
                      <p class="truncate text-xs font-medium text-slate-700">{{ ind.group || ind.label }}</p>
                      <svg
                        v-if="idx === 0 || idx === 1 || idx === 2"
                        class="h-4 w-4 drop-shadow-sm"
                        :class="idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : 'text-orange-700'"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M8 2h8l-2 5h-4L8 2z" />
                        <path d="M7 7h10l-5 7-5-7z" />
                        <circle cx="12" cy="17" r="5" />
                      </svg>
                    </div>
                    <div class="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                      <div
                        class="h-full rounded-full bg-slate-400 transition-all duration-700 ease-out"
                        :style="{ width: barAnimated ? `${(ind.count / Math.max(1, summaryAnimated.topIndustries[0].count || 1)) * 100}%` : '0%' }"
                      />
                    </div>
                  </div>
                <span class="text-xs font-bold text-slate-900">{{ Math.round(ind.count || 0) }}</span>
              </div>
            </div>
             <p v-else class="text-sm text-slate-500 italic">Belum ada data industri.</p>
          </div>
        </div>
        </template>
      </section>

      <section v-else-if="tab === 'questions'" class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-sm font-semibold text-slate-900">Jawaban per pertanyaan</h2>
            <p class="text-[11px] text-slate-500">
              Ditampilkan sesuai pertanyaan di kuisioner aktif. Setiap jawaban dilabeli user/prodi/fakultas.
            </p>
          </div>
          <p class="text-[11px] text-slate-500">Scroll lembut antar pertanyaan.</p>
        </div>
        <div class="space-y-4">
          <article
            v-for="block in paginatedQuestionBlocks"
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
                v-for="item in block.counts.slice(0, 5)"
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
                v-for="(ans, idx) in block.answers.slice(0, 5)"
                :key="`${block.id}-${idx}`"
                class="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700"
              >
                <p class="font-semibold text-slate-900">{{ ans.answer }}</p>
                <p class="text-[11px] text-slate-500">
                  Oleh {{ ans.user }} • {{ ans.prodi || '-' }} • {{ ans.fakultas || '-' }} • Status: {{ ans.status }}
                </p>
              </div>

              <button
                v-if="block.answers.length > 5"
                type="button"
                class="mt-2 flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                @click="openAnswersModal(block)"
              >
                Lihat semua ({{ block.answers.length }})
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </button>

              <p v-if="!block.answers?.length" class="text-xs text-slate-500">Belum ada jawaban untuk pertanyaan ini.</p>
            </div>
          </article>
        </div>

        <!-- Pagination (Flush Style) -->
        <div v-if="totalPages > 1" class="flex items-center justify-between border-t border-slate-200 px-4 sm:px-0 mt-6 pt-4">
          <div class="-mt-px flex w-0 flex-1">
            <button
              type="button"
              class="inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="currentPage === 1"
              @click="changePage(currentPage - 1)"
            >
              <svg class="mr-3 h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M18 10a.75.75 0 01-.75.75H4.66l2.1 1.95a.75.75 0 11-1.02 1.1l-3.5-3.25a.75.75 0 010-1.1l3.5-3.25a.75.75 0 111.02 1.1l-2.1 1.95h12.59A.75.75 0 0118 10z" clip-rule="evenodd" />
              </svg>
              Sebelumnya
            </button>
          </div>
          <div class="hidden md:-mt-px md:flex">
            <button
              v-for="p in totalPages"
              :key="p"
              type="button"
              class="inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium"
              :class="currentPage === p ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'"
              @click="changePage(p)"
            >
              {{ p }}
            </button>
          </div>
          <div class="-mt-px flex w-0 flex-1 justify-end">
            <button
              type="button"
              class="inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="currentPage === totalPages"
              @click="changePage(currentPage + 1)"
            >
              Berikutnya
              <svg class="ml-3 h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M2 10a.75.75 0 01.75-.75h12.59l-2.1-1.95a.75.75 0 111.02-1.1l3.5 3.25a.75.75 0 010 1.1l-3.5 3.25a.75.75 0 11-1.02-1.1l2.1-1.95H2.75A.75.75 0 012 10z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <section v-else class="space-y-4 rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70">
        <div class="flex flex-wrap items-start justify-between gap-3">
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
              :disabled="currentResponseIndex >= individualRecords.length - 1"
              @click="currentResponseIndex = Math.min(individualRecords.length - 1, currentResponseIndex + 1)"
            >
              Berikutnya
            </button>
            <button
              type="button"
              class="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-indigo-700 transition hover:bg-indigo-100"
              :disabled="!currentResponse || printingPdf"
              @click="printCurrentResponsePdf"
            >
              {{ printingPdf ? 'Mencetak...' : 'Cetak PDF' }}
            </button>
          </div>
        </div>
        <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex-1">
              <label class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Filter nama / NIM</label>
              <textarea
                v-model="individualSearch"
                rows="1"
                class="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm outline-none ring-0 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="Tulis nama atau NIM. Pisahkan dengan baris baru atau koma."
              />
            </div>
            <div class="text-[11px] font-semibold text-slate-500 sm:pt-6">
              Menampilkan {{ individualRecords.length }} dari {{ filteredRecords.length }}
            </div>
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
    <LoadingOverlay :active="pageLoading" />
  </AdminShell>

  <!-- Modal untuk melihat semua jawaban -->
  <Teleport to="body">
    <div v-if="answersModal.show" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div 
        class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        @click="answersModal.show = false"
      />
      
      <!-- Modal Content -->
      <div class="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <p class="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-1">Semua Jawaban</p>
            <h3 class="text-lg font-bold text-slate-900">{{ answersModal.title }}</h3>
            <p class="text-xs text-slate-500">Total {{ answersModal.answers.length }} responden</p>
          </div>
          <button 
            @click="answersModal.show = false"
            class="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body (Scrollable) -->
        <div class="flex-1 overflow-y-auto p-6 space-y-3">
          <div
            v-for="(ans, idx) in answersModal.answers"
            :key="idx"
            class="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-indigo-100 hover:bg-indigo-50/30"
          >
            <p class="text-base font-semibold text-slate-900 mb-1">{{ ans.answer }}</p>
            <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span class="font-bold text-slate-700">{{ ans.user }}</span>
              <span class="text-slate-300">•</span>
              <span>{{ ans.prodi || '-' }}</span>
              <span class="text-slate-300">•</span>
              <span>{{ ans.fakultas || '-' }}</span>
              <span class="text-slate-300">•</span>
              <span 
                class="rounded-full px-2 py-0.5"
                :class="{
                  'bg-emerald-100 text-emerald-700': ['bekerja', 'wiraswasta'].includes(ans.status),
                  'bg-indigo-100 text-indigo-700': ans.status === 'melanjutkan',
                  'bg-slate-100 text-slate-600': !['bekerja', 'wiraswasta', 'melanjutkan'].includes(ans.status)
                }"
              >
                {{ ans.status }}
              </span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="border-t border-slate-100 p-4 bg-slate-50/50 flex justify-end">
          <button 
            @click="answersModal.show = false"
            class="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>

