<script setup>
import { computed, reactive, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminShell from '../components/AdminShell.vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import { useQuestionnaires } from '../stores/questionnaires'
import { useSubmissions } from '../stores/submissions'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import { getResponsesSummary } from '../services/tracerService'
import { useAlumni } from '../stores/alumni'
import {
  ALUMNI_TEMPLATE_HEADERS,
  buildAlumniTemplateAoA,
  buildAlumniTemplateDataRow,
} from '../utils/alumniExportTemplate'

const route = useRoute()
const router = useRouter()
const { questionnaires, fetchQuestionnaires, fetchQuestions, questionsById } = useQuestionnaires()
const {
  submissions,
  fetchSubmissions,
  fetchSubmissionsPage,
  pagedItems,
  pagedMeta,
  pagedLoading,
  pagedError,
  loading: submissionsLoading,
  error: submissionsError,
} = useSubmissions()
const { alumni, fetchAlumni } = useAlumni()

const questionnaireId = computed(() => String(route.params.id ?? ''))
const questionnaire = computed(
  () => questionnaires.value.find((item) => String(item.id) === questionnaireId.value) || null,
)

const filters = reactive({
  tahun: 'all',
  fakultas: 'all',
  prodi: 'all',
  status: ['all'],
  questionId: '',
  answerValue: '',
})

const targetAudience = computed(() => questionnaire.value?.audience || 'alumni')
const tabContainerRef = ref(null)
const tabRefs = ref([])
const tabIndicator = reactive({ left: 0, top: 0, width: 0, height: 0 })
const activeTabKey = ref('detail')

const normalizeStatus = (val, fallback = 'belum') => {
  const key = String(val || fallback).trim().toLowerCase()
  if (targetAudience.value === 'umum') return key || 'umum'
  return key === 'umum' ? 'belum' : key
}

const formatFriendlyLabel = (key) => {
  if (!key) return 'Pertanyaan'
  const byUnderscore = String(key).replace(/_/g, ' ')
  const splitCamel = byUnderscore.replace(/([a-z])([A-Z])/g, '$1 $2')
  return splitCamel
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const extractQuestionLabel = (question) => {
  if (!question) return null
  const candidates = [
    question.label,
    question.question,
    question.text,
    question.prompt,
    question.title,
    question.title_en,
    question.questionText,
    question.question_label,
    question.pertanyaan,
  ]
  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'string' && candidate.trim().length) {
      return candidate.trim()
    }
  }
  return null
}

const hasMeaningfulValue = (value) => {
  if (value === undefined || value === null) return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value).length > 0
  return String(value).trim() !== ''
}

const extractAnswerValue = (answer) => {
  if (answer === undefined || answer === null) return ''
  if (typeof answer !== 'object') return answer
  return (
    answer.jawaban ??
    answer.answer ??
    answer.value ??
    answer.response ??
    answer.respon ??
    ''
  )
}

const extractQuestionTextFromAnswer = (answer) => {
  if (!answer || typeof answer !== 'object') return ''
  const rawQuestion =
    answer.question ??
    answer.pertanyaan ??
    answer.question_text ??
    answer.questionText ??
    answer.label ??
    answer.text
  if (typeof rawQuestion === 'object') {
    return (
      rawQuestion.pertanyaan ||
      rawQuestion.label ||
      rawQuestion.text ||
      rawQuestion.question ||
      ''
    )
  }
  return rawQuestion || ''
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
  { id: 'bekerja_mulaiSebelum', label: 'Mulai mencari kerja (bulan sebelum lulus)', key: 'bekerja_mulaiSebelum', statusGroup: 'bekerja', tipe: 'number' },
  { id: 'bekerja_mulaiSetelah', label: 'Mulai mencari kerja (bulan setelah lulus)', key: 'bekerja_mulaiSetelah', statusGroup: 'bekerja', tipe: 'number' },
  { id: 'bekerja_lebihCepat6Bulan', label: 'Dapat kerja <=6 bulan sebelum/setelah lulus?', key: 'bekerja_lebihCepat6Bulan', statusGroup: 'bekerja', tipe: 'select', pilihan: ['Ya', 'Tidak'] },
  { id: 'bekerja_bulanDapat', label: 'Berapa bulan sampai dapat kerja', key: 'bekerja_bulanDapat', statusGroup: 'bekerja', tipe: 'number' },
  { id: 'bekerja_bulanTidak', label: 'Berapa bulan sampai dapat kerja', key: 'bekerja_bulanTidak', statusGroup: 'bekerja', tipe: 'number' },
  { id: 'bekerja_pendapatan', label: 'Pendapatan per bulan', key: 'bekerja_pendapatan', statusGroup: 'bekerja', tipe: 'number' },
  { id: 'bekerja_tingkatTempatKerja', label: 'Tingkat tempat kerja', key: 'bekerja_tingkatTempatKerja', statusGroup: 'bekerja', tipe: 'select', pilihan: ['Lokal/Wilayah/Wiraswasta tidak berbadan hukum', 'Nasional/Wiraswasta berbadan hukum', 'Multinasional/Internasional'] },
  { id: 'bekerja_lokasiDetail', label: 'Lokasi bekerja', key: 'bekerja_lokasiDetail', statusGroup: 'bekerja', tipe: 'text' },
  { id: 'bekerja_provinsi', label: 'Provinsi lokasi bekerja', key: 'bekerja_provinsi', statusGroup: 'bekerja', tipe: 'select', pilihan: [] },
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
  },
  {
    id: 'kompetensi_pembelajaran',
    label: 'Penilaian kompetensi pembelajaran',
    key: 'kompetensi_pembelajaran',
    statusGroup: 'umum',
    tipe: 'scale',
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

const deriveStatusFromLabel = (label) => {
  const l = (label || '').toLowerCase()
  if (l.includes('wirausaha') || l.includes('usaha sendiri') || l.includes('bisnis')) return 'wiraswasta'
  if (l.includes('studi') || l.includes('lanjut') || l.includes('kuliah') || l.includes('universitas')) return 'melanjutkan'
  if (l.includes('mencari') || l.includes('lamar')) return 'mencari'
  if (l.includes('kerja') || l.includes('gaji') || l.includes('kantor') || l.includes('perusahaan')) return 'bekerja'
  return null
}

const toNumber = (val) => {
  const num = Number(String(val ?? '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(num) ? num : 0
}

const normalizeSalaryToJt = (val) => {
  const raw = toNumber(val)
  if (!raw) return 0
  // heuristik: jika > 1000 anggap rupiah, konversi ke juta; jika kecil, anggap sudah juta
  if (raw > 1000) return Math.round((raw / 1_000_000) * 10) / 10
  return Math.round(raw * 10) / 10
}

const getFormData = (payload) => {
  const raw = payload?.raw || payload || {}
  return raw?.formData || raw?.form_data || raw || {}
}

const pickFirstValue = (source, keys = []) => {
  if (!source || typeof source !== 'object') return ''
  for (const key of keys) {
    if (!key) continue
    const value = source[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value
    }
  }
  return ''
}

const dynamicQuestions = computed(() =>
  questionnaire.value?.id ? questionsById(questionnaire.value.id) || [] : [],
)

const findDynamicKeyByLabel = (label) => {
  if (!label) return ''
  const target = String(label).trim().toLowerCase()
  const match = dynamicQuestions.value.find((q) => {
    const qLabel = extractQuestionLabel(q)
    if (!qLabel) return false
    const normalized = String(qLabel).trim().toLowerCase()
    return normalized === target || normalized.includes(target) || target.includes(normalized)
  })
  return match ? String(match.id) : ''
}

const getRawValue = (raw, key) => {
  if (!raw) return null
  const formData = raw.formData || raw.form_data || {}
  const dyn = raw.dynamicAnswers || raw.dynamic_answers || raw.dynamic || {}
  const answersMap =
    raw.answers && typeof raw.answers === 'object' && !Array.isArray(raw.answers)
      ? raw.answers
      : raw.responses && typeof raw.responses === 'object' && !Array.isArray(raw.responses)
        ? raw.responses
        : raw.jawaban && typeof raw.jawaban === 'object' && !Array.isArray(raw.jawaban)
          ? raw.jawaban
          : null
  const answerList = Array.isArray(raw.answers)
    ? raw.answers
    : Array.isArray(raw.responses)
      ? raw.responses
      : Array.isArray(raw.jawaban)
        ? raw.jawaban
        : Array.isArray(raw.response_answers)
          ? raw.response_answers
          : Array.isArray(raw.data)
            ? raw.data
            : null
  const normalized = String(key)

  if (Object.prototype.hasOwnProperty.call(dyn, normalized)) {
    return dyn[normalized]
  }
  if (Object.prototype.hasOwnProperty.call(formData, normalized)) {
    return formData[normalized]
  }
  if (Object.prototype.hasOwnProperty.call(formData, `question-${normalized}`)) {
    return formData[`question-${normalized}`]
  }
  if (answersMap && Object.prototype.hasOwnProperty.call(answersMap, normalized)) {
    return extractAnswerValue(answersMap[normalized])
  }
  if (answersMap && Object.prototype.hasOwnProperty.call(answersMap, `question-${normalized}`)) {
    return extractAnswerValue(answersMap[`question-${normalized}`])
  }
  if (raw[normalized] !== undefined) {
    return raw[normalized]
  }

  if (Array.isArray(answerList)) {
    const byId = answerList.find((ans) => {
      const qid = ans.question_id ?? ans.questionId ?? ans.id
      return String(qid) === normalized
    })
    if (byId) return extractAnswerValue(byId)
    if (!/^\d+$/.test(normalized)) {
      const target = normalized.toLowerCase()
      const byLabel = answerList.find((ans) =>
        String(extractQuestionTextFromAnswer(ans) || '').toLowerCase().includes(target),
      )
      if (byLabel) return extractAnswerValue(byLabel)
    }
  }

  if (Array.isArray(answerList) && typeof normalized === 'string') {
    const qDef = questionFields.value ? questionFields.value.find((q) => q.key === normalized) : null
    if (qDef?.label) {
      const match = answerList.find((ans) => {
        const qText = extractQuestionTextFromAnswer(ans)
        const qStr = String(qText || '').toLowerCase()
        const labelStr = String(qDef.label).toLowerCase()
        const idStr = String(qDef.id || '').replace(/_/g, ' ').toLowerCase()
        return qStr.includes(labelStr) || (idStr.length > 4 && qStr.includes(idStr))
      })
      if (match) return extractAnswerValue(match)
    }
  }

  if (typeof normalized === 'string') {
    const qDef = questionFields.value ? questionFields.value.find((q) => q.key === normalized) : null
    if (qDef?.label) {
      const aliasKey = findDynamicKeyByLabel(qDef.label)
      if (aliasKey && aliasKey !== normalized) {
        const aliasValue = getRawValue(raw, aliasKey)
        if (hasMeaningfulValue(aliasValue)) return aliasValue
      }
    }
  }

  return null
}

const findValueByKeywords = (source, keywords = []) => {
  const formData = getFormData(source)
  const rawSource = source.raw || source || {}
  const rawAnswers =
    rawSource.answers ||
    rawSource.responses ||
    rawSource.jawaban ||
    rawSource.response_answers ||
    rawSource.data ||
    []
  const kwLowers = keywords.map(k => k.toLowerCase())

  // 1. Try search in rawAnswers by question text matching keywords
  if (Array.isArray(rawAnswers)) {
    for (const kw of kwLowers) {
      const match = rawAnswers.find((ans) => {
        const qText = extractQuestionTextFromAnswer(ans)
        const qStr = String(qText).toLowerCase()
        return qStr.includes(kw) || kw.includes(qStr)
      })
      const matchValue = match ? extractAnswerValue(match) : null
      if (hasMeaningfulValue(matchValue)) {
        return matchValue
      }
    }
  }

  // 2. Try search in formData using labels from questionFields
  if (questionFields.value) {
    for (const kw of kwLowers) {
      const dynamicMatch = dynamicQuestions.value.find((q) => {
        const lbl = String(extractQuestionLabel(q) || '').toLowerCase()
        return lbl && (lbl.includes(kw) || kw.includes(lbl))
      })
      if (dynamicMatch) {
        const rawValue = getRawValue(rawSource, dynamicMatch.id)
        if (hasMeaningfulValue(rawValue)) return rawValue
      }
      const qField = questionFields.value.find((q) => {
        const lbl = String(q.label || '').toLowerCase()
        return lbl.includes(kw) || kw.includes(lbl)
      })
      if (qField) {
        const rawValue = getRawValue(rawSource, qField.key)
        if (hasMeaningfulValue(rawValue)) return rawValue
        const formValue = formData[qField.key]
        if (hasMeaningfulValue(formValue)) return formValue
      }
    }
  }

  // 3. Try search in root properties (and snake_case variants)
  const allKeysToTry = [...keywords]
  keywords.forEach(kw => {
    allKeysToTry.push(kw.replace(/\s+/g, '_'))
    allKeysToTry.push(kw.replace(/\s+/g, ''))
  })

  // Check top level of root source (mapped item) and inner raw object
  const rootValue = pickFirstValue(source, allKeysToTry) || pickFirstValue(source.raw || {}, allKeysToTry)
  if (hasMeaningfulValue(rootValue)) return rootValue

  // 4. Fallback to pickFirstValue with keywords (as literal keys in formData)
  return pickFirstValue(formData, allKeysToTry)
}

const mapAlumniRecord = (s) => {
  const formData = getFormData(s)
  const statusAnswer = pickFirstValue(formData, ['status', 'status_pekerjaan']) || s.status
  const waitMonths = toNumber(
    pickFirstValue(formData, [
      'bekerja_bulanDapat',
      'bekerja_bulanTidak',
      'mencari_mulaiSetelah',
      'mencari_mulaiSebelum',
      'waitMonths',
    ]) || s.waitMonths,
  )
  return {
    id: s.id,
    nama: pickFirstValue(formData, ['nama', 'nama_alumni', 'name']) || s.nama || 'Alumni',
    prodi: pickFirstValue(formData, ['prodi', 'programStudi', 'program_studi', 'program']) || s.prodi || 'Lainnya',
    fakultas: pickFirstValue(formData, ['fakultas', 'faculty']) || s.fakultas || '-',
    tahun: toNumber(pickFirstValue(formData, ['tahun', 'tahunLulus', 'tahun_lulus'])) || (s.tahun ? Number(s.tahun) : null),
    status: normalizeStatus(statusAnswer),
    waitMonths,
    salary: normalizeSalaryToJt(pickFirstValue(formData, ['bekerja_pendapatan', 'salary']) || s.salary),
    province:
      pickFirstValue(formData, ['bekerja_provinsi', 'studi_lokasi', 'province']) ||
      s.province ||
      '-',
    industry:
      pickFirstValue(formData, ['bekerja_jenisPerusahaan', 'wira_jenisPerusahaan', 'wira_bidang', 'industry']) ||
      s.industry ||
      'Lainnya',
    suitability: toNumber(pickFirstValue(formData, ['bekerja_kesesuaianBidang', 'wira_kesesuaian', 'suitability'])) || 0,
    eduFit: pickFirstValue(formData, ['bekerja_pendidikanSesuai', 'wira_pendidikan', 'eduFit']) || '-',
    raw: s.raw || s,
  }
}

const mapPenggunaRecord = (s) => {
  const industry = findValueByKeywords(s, ['bidang industri', 'bidang usaha', 'sektor', 'bidang', 'jenis usaha', 'kategori usaha'])
  const lokasi = findValueByKeywords(s, ['lokasi', 'kota', 'kabupaten', 'alamat', 'provinsi', 'domisili'])
  const pic = findValueByKeywords(s, ['nama pic', 'pimpinan', 'atasan', 'nama pimpinan'])
  const jabatan = findValueByKeywords(s, ['jabatan pic', 'posisi pic', 'jabatan', 'pangkat', 'role'])
  const kontak = findValueByKeywords(s, kontakKeywords)
  const namaAlumni = findValueByKeywords(s, ['nama alumni', 'alumni yang dinilai', 'identitas alumni', 'target alumni'])
  const organisasi = findValueByKeywords(s, ['nama perusahaan', 'instansi', 'organisasi', 'nama kantor', 'pt ', 'cv ', 'nama usaha', 'tempat kerja'])

  return {
    id: s.id,
    nama: organisasi || pic || s.nama || 'Pengguna alumni',
    prodi: industry || s.bidang || 'Bidang',
    fakultas: lokasi || s.lokasi || '-',
    kontak: kontak || s.kontak || '-',
    jabatan: jabatan || s.jabatan || '-',
    namaAlumni: namaAlumni || s.nama_alumni || '-',
    tahun: null,
    status: 'pengguna',
    waitMonths: 0,
    salary: 0,
    province: lokasi || '-',
    industry: industry || 'Lainnya',
    suitability: 0,
    eduFit: '-',
    raw: s.raw || s,
  }
}

const responseItems = computed(() =>
  hasServerPagination.value ? pagedItems.value || [] : submissions.items || [],
)

const filterAudienceItems = (items = []) => {
  const targetType = targetAudience.value === 'pengguna' ? 'pengguna' : targetAudience.value
  if (!Array.isArray(items)) return []

  const allowedTypes =
    targetType === 'pengguna' ? new Set(['pengguna', 'pengguna_alumni']) : new Set([targetType])
  const filtered = items.filter((item) => {
    const type = String(item.type || item.audience || '').toLowerCase()
    return allowedTypes.has(type)
  })

  const seen = new Set()
  return filtered.filter((item) => {
    if (!item.id) return true
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

const mapRecordsByAudience = (items = []) => {
  const submissionsByAudience = filterAudienceItems(items)
  if (targetAudience.value === 'pengguna') {
    return submissionsByAudience.map(mapPenggunaRecord)
  }
  if (targetAudience.value === 'umum') {
    return submissionsByAudience.map((s) => ({
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
      suitability: 0,
      eduFit: '-',
      timestamp: s.createdAt || s.timestamp || '',
      raw: s.raw || s,
    }))
  }
  return submissionsByAudience.map(mapAlumniRecord)
}

const allRecords = computed(() => mapRecordsByAudience(responseItems.value))

const isQuestionAnswerFilterActive = computed(
  () => Boolean(filters.questionId && String(filters.answerValue || '').trim() !== ''),
)
const isRecordFilterActive = computed(
  () =>
    filters.tahun !== 'all' ||
    filters.fakultas !== 'all' ||
    filters.prodi !== 'all' ||
    !filters.status.includes('all') ||
    isQuestionAnswerFilterActive.value,
)

const filterRecords = (records = []) =>
  records.filter((item) => {
    // For Pengguna, ignore traditional Alumni filters if they are 'all'
    if (targetAudience.value === 'pengguna') {
      let matchQs = true
      if (isQuestionAnswerFilterActive.value) {
        const rawVal = getRawValue(item.raw || item, filters.questionId)
        const target = String(filters.answerValue).trim().toLowerCase()
        if (Array.isArray(rawVal)) {
          matchQs = rawVal.some((val) => String(val).trim().toLowerCase() === target)
        } else {
          matchQs = String(rawVal || '').trim().toLowerCase() === target
        }
      }
      return matchQs
    }

    const matchStatus = filters.status.includes('all') || filters.status.includes(item.status)
    const matchProdi = filters.prodi === 'all' || item.prodi === filters.prodi
    const matchFak = filters.fakultas === 'all' || item.fakultas === filters.fakultas
    const matchTahun = filters.tahun === 'all' || String(item.tahun) === filters.tahun
    if (isQuestionAnswerFilterActive.value) {
      const rawVal = getRawValue(item.raw || item, filters.questionId)
      const target = String(filters.answerValue).trim().toLowerCase()
      let match = false
      if (Array.isArray(rawVal)) {
        match = rawVal.some((val) => String(val).trim().toLowerCase() === target)
      } else {
        match = String(rawVal || '').trim().toLowerCase() === target
      }
      if (!match) return false
    }
    return matchStatus && matchProdi && matchFak && matchTahun
  })

const filteredRecords = computed(() => filterRecords(allRecords.value))

const summaryPayload = ref(null)
const summaryLoading = ref(false)
const summaryError = ref('')
const exportMessage = ref('')
const isLocalOnlyQuestionFilter = computed(
  () => isQuestionAnswerFilterActive.value && !normalizeQuestionId(filters.questionId),
)
const useClientDataMode = computed(
  () => pageSize.value === 'all' || isLocalOnlyQuestionFilter.value,
)
const hasServerSummary = computed(() => !!summaryPayload.value && !useClientDataMode.value)
const hasServerPagination = computed(
  () => !useClientDataMode.value && pagedMeta.value?.total !== undefined && pageSize.value !== 'all',
)

const summary = computed(() => {
  if (hasServerSummary.value) {
    const payload = summaryPayload.value || {}
    const payloadTotal = Number(
      payload.total ??
        payload.total_respon ??
        payload.total_response ??
        payload.totalResponses ??
        0,
    )
    const syncedTotal = hasServerPagination.value
      ? Number(pagedMeta.value?.total || payloadTotal || 0)
      : payloadTotal
    return {
      ...payload,
      total: Number.isFinite(syncedTotal) ? syncedTotal : 0,
    }
  }
  const data = filteredRecords.value
  const total = data.length

  if (targetAudience.value === 'pengguna') {
      const industryCounts = data.reduce((acc, d) => {
        const key = d.industry || 'Lainnya'
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})
      const topIndustry = Object.entries(industryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'
      
      const locCounts = data.reduce((acc, d) => {
        const key = d.province || 'Lainnya' // mapped to lokasi
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})
      const topLoc = Object.entries(locCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'

      return {
        total,
        employedPercent: 0, // Not used
        waitAvg: 0, // Not used
        salaryAvg: 0, // Not used
        topIndustry,
        topLocation: topLoc,
        statusCounts: [], // No status breakdown for pengguna
        isPengguna: true // Flag for UI
      }
  }

  const denom = Math.max(total, 1)
  const bekerjaCount = data.filter((d) => ['bekerja', 'wiraswasta'].includes(d.status)).length
  const employedPercent = total ? Math.round((bekerjaCount / denom) * 100) : 0

  const waits = data.filter((d) => d.waitMonths >= 0)
  const waitAvg = waits.length ? waits.reduce((sum, d) => sum + d.waitMonths, 0) / waits.length : 0

  const salaryItems = data.filter((d) => d.salary > 0)
  const salaryAvg = salaryItems.length
    ? salaryItems.reduce((sum, d) => sum + d.salary, 0) / salaryItems.length
    : 0

  const industryCounts = data.reduce((acc, d) => {
    const key = d.industry || 'Lainnya'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  const topIndustry = Object.entries(industryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'

  const statusConfig =
    targetAudience.value === 'pengguna'
      ? [{ key: 'pengguna', label: 'Pengguna alumni' }]
      : targetAudience.value === 'umum'
        ? [{ key: 'umum', label: 'Umum' }]
      : [
          { key: 'bekerja', label: 'Bekerja' },
          { key: 'wiraswasta', label: 'Wirausaha' },
          { key: 'melanjutkan', label: 'Studi lanjut' },
          { key: 'mencari', label: 'Mencari kerja' },
          { key: 'belum', label: 'Belum memungkinkan bekerja' },
        ]

  const statusCounts = statusConfig.map((item) => ({
    label: item.label,
    value: data.filter((d) => d.status === item.key).length,
  }))

  return {
    total,
    employedPercent,
    waitAvg: waitAvg.toFixed(1),
    salaryAvg: salaryAvg ? `${salaryAvg.toFixed(1)} jt` : 'N/A',
    topIndustry,
    statusCounts,
    isPengguna: false
  }
})

const uniqueSource = computed(() => (hasServerPagination.value ? alumni.value?.items || [] : allRecords.value))

const uniqueValues = computed(() => ({
  tahun: Array.from(new Set(uniqueSource.value.map((d) => d.tahun || d.tahun_lulus).filter(Boolean)))
    .map(String)
    .sort((a, b) => Number(b) - Number(a)),
  fakultas: Array.from(new Set(uniqueSource.value.map((d) => d.fakultas).filter(Boolean))).sort(),
  prodi: Array.from(new Set(uniqueSource.value.map((d) => d.prodi).filter(Boolean))).sort(),
}))

const prodiOptions = computed(() => {
  if (filters.fakultas === 'all') return uniqueValues.value.prodi
  return Array.from(
    new Set(
      uniqueSource.value
        .filter((item) => item.fakultas === filters.fakultas)
        .map((item) => item.prodi)
        .filter(Boolean),
    ),
  ).sort()
})

const alumniByNim = computed(() => {
  const map = new Map()
  const items = alumni.value?.items || []
  items.forEach((item) => {
    const key = String(item.nim || '').trim()
    if (key) {
      map.set(key, item)
    }
  })
  return map
})

const questionFields = computed(() => {
  const audience = questionnaire.value?.audience || 'alumni'
  const bank =
    (audience === 'pengguna' ? bankQuestionsPengguna : bankQuestionsAlumni).map((q) => ({
      ...q,
      isBank: true,
    }))
  const dynamic = questionnaire.value?.id ? questionsById(questionnaire.value.id) : []
  const mappedDynamic = dynamic
    .map((q) => ({
      id: q.id,
      label: extractQuestionLabel(q) || formatFriendlyLabel(q.id),
      key: q.id,
      statusGroup: q.statusCondition || q.status_condition || deriveStatusFromLabel(extractQuestionLabel(q)) || 'umum',
      urutan: Number(q.urutan || 99999),
      tipe: q.tipe,
      pilihan: q.pilihan,
      isBank: false,
    }))
    .sort((a, b) => a.urutan - b.urutan)

  if (mappedDynamic.length) return mappedDynamic
  return bank
})
const hasQuestionnaireQuestions = computed(() =>
  questionFields.value.some((q) => !q.isBank),
)
const scopedQuestionFields = computed(() =>
  hasQuestionnaireQuestions.value
    ? questionFields.value.filter((q) => !q.isBank)
    : questionFields.value,
)

const availableFilterQuestions = computed(() => {
  return scopedQuestionFields.value.filter((q) => {
    const isAll = filters.status.includes('all')
    const qStatus = String(q.statusGroup || '').trim().toLowerCase()
    const matchesStatus = isAll || filters.status.some((s) => s.toLowerCase() === qStatus)
    if (!matchesStatus) return false

    const allowedTypes = ['radio', 'select', 'checkbox', 'pilihan ganda', 'multiple_choice']
    return allowedTypes.includes(String(q.tipe || '').toLowerCase())
  })
})

const availableFilterOptions = computed(() => {
  if (!filters.questionId) return []
  const question = scopedQuestionFields.value.find((q) => q.key === filters.questionId)
  if (!question) return []
  if (question.pilihan && Array.isArray(question.pilihan)) return question.pilihan
  if (question.pilihan && typeof question.pilihan === 'string') {
    try {
      return JSON.parse(question.pilihan)
    } catch (e) {
      return question.pilihan.split(',').map((val) => val.trim())
    }
  }

  const records = allRecords.value
  const uniqueValues = new Set()
  records.forEach((record) => {
    const rowVal = getRawValue(record.raw || record, question.key)
    if (Array.isArray(rowVal)) {
      rowVal.forEach((val) => val && uniqueValues.add(String(val).trim()))
    } else if (rowVal) {
      uniqueValues.add(String(rowVal).trim())
    }
  })
  return Array.from(uniqueValues).sort()
})

const formatCellValue = (value) => {
  if (value === undefined || value === null) return '-'
  const text = String(value).trim()
  return text === '' ? '-' : value
}
const formatQuestionAnswerCell = (row, questionKey) => {
  const rawValue = getRawValue(row?.raw || row || {}, questionKey)
  if (!hasMeaningfulValue(rawValue)) return '-'
  if (Array.isArray(rawValue)) {
    const joined = rawValue.map((item) => String(item ?? '').trim()).filter(Boolean).join('; ')
    return joined || '-'
  }
  if (typeof rawValue === 'object') {
    const joined = Object.entries(rawValue)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ')
    return joined || '-'
  }
  return formatCellValue(rawValue)
}
const umumTableQuestions = computed(() =>
  targetAudience.value === 'umum' ? scopedQuestionFields.value : [],
)

const resolvePenggunaValue = (
  record,
  key,
  keywords,
  fallback = '',
  formatter = formatCellValue,
) => {
  const raw = record?.raw || record
  const keys = Array.isArray(key) ? key : [key]
  for (const candidate of keys) {
    if (!candidate) continue
    const direct = getRawValue(raw, candidate)
    if (hasMeaningfulValue(direct)) return formatter(direct)
  }
  const byKeyword = findValueByKeywords(record, keywords)
  if (hasMeaningfulValue(byKeyword)) return formatter(byKeyword)
  if (hasMeaningfulValue(fallback)) return formatter(fallback)
  return '-'
}

const kontakKeywords = [
  'kontak',
  'email',
  'email pic',
  'email perusahaan',
  'no kontak',
  'no. kontak',
  'nomor kontak',
  'no telepon',
  'no telp',
  'no. telp',
  'no. telepon',
  'telepon',
  'telp',
  'telpon',
  'phone',
  'mobile',
  'hp',
  'handphone',
  'whatsapp',
  'wa',
  'contact',
  'kontak pic',
  'kontak perusahaan',
  'email / no. kontak',
  'email/no kontak',
]

const kontakKeys = [
  'kontak',
  'contact',
  'email',
  'email_pic',
  'email_perusahaan',
  'no_kontak',
  'no_kontak_pic',
  'no_telepon',
  'no_telpon',
  'no_telp',
  'telepon',
  'telp',
  'telpon',
  'phone',
  'mobile',
  'hp',
  'no_hp',
  'nohp',
  'handphone',
  'whatsapp',
  'wa',
]

const formatContactValue = (value) => {
  if (!hasMeaningfulValue(value)) return '-'
  if (Array.isArray(value)) {
    const text = value.filter((item) => hasMeaningfulValue(item)).join(' / ')
    return formatCellValue(text)
  }
  if (typeof value === 'object') {
    const email =
      value.email ||
      value.email_pic ||
      value.emailPerusahaan ||
      value.mail ||
      value.contact_email ||
      ''
    const phone =
      value.phone ||
      value.telepon ||
      value.telp ||
      value.telpon ||
      value.hp ||
      value.no_hp ||
      value.nohp ||
      value.whatsapp ||
      value.wa ||
      value.contact_phone ||
      ''
    const parts = [email, phone].filter((item) => hasMeaningfulValue(item))
    if (parts.length) return formatCellValue(parts.join(' / '))
    const flat = Object.values(value).filter((item) => hasMeaningfulValue(item))
    return formatCellValue(flat.join(' / '))
  }
  return formatCellValue(value)
}

const tableRows = computed(() =>
  filteredRecords.value.map((item) => {
    const formData = getFormData(item)

    if (targetAudience.value === 'pengguna') {
      const nama = resolvePenggunaValue(
        item,
        'organisasi',
        ['nama perusahaan', 'instansi', 'organisasi', 'nama kantor', 'pt ', 'cv ', 'nama usaha', 'tempat kerja'],
        item.nama,
      )
      const bidang = resolvePenggunaValue(
        item,
        'bidang',
        ['bidang industri', 'bidang usaha', 'sektor', 'bidang', 'jenis usaha', 'kategori usaha'],
        item.prodi,
      )
      const lokasi = resolvePenggunaValue(
        item,
        'lokasi',
        ['lokasi', 'kota', 'kabupaten', 'alamat', 'provinsi', 'domisili'],
        item.fakultas,
      )
      const kontak = resolvePenggunaValue(
        item,
        kontakKeys,
        kontakKeywords,
        item.kontak,
        formatContactValue,
      )
      const jabatan = resolvePenggunaValue(
        item,
        'jabatan',
        ['jabatan pic', 'posisi pic', 'jabatan', 'pangkat', 'role'],
        item.jabatan,
      )
      const namaAlumni = resolvePenggunaValue(
        item,
        'nama_alumni',
        ['nama alumni', 'alumni yang dinilai', 'identitas alumni', 'target alumni'],
        item.namaAlumni,
      )

      return {
        id: item.id,
        nama,
        prodi: bidang,
        fakultas: lokasi,
        kontak,
        jabatan,
        namaAlumni,
        raw: item.raw || item,
      }
    }
    if (targetAudience.value === 'umum') {
      return {
        id: item.id,
        raw: item.raw || item,
        timestamp: item.timestamp || item.createdAt || '',
      }
    }

    // Alumni Specific
    const nama = formatCellValue(pickFirstValue(formData, ['nama', 'nama_alumni', 'name']) || item.nama)
    const prodi = formatCellValue(
      pickFirstValue(formData, ['prodi', 'programStudi', 'program_studi', 'program', 'bidang']) ||
        item.prodi,
    )
    const fakultas = formatCellValue(
      pickFirstValue(formData, ['fakultas', 'faculty', 'lokasi']) || item.fakultas,
    )

    const nimValue = String(
      pickFirstValue(formData, ['nim', 'nim_alumni', 'nomor_induk']) ||
        item.nim ||
        item.raw?.nim ||
        '',
    ).trim()
    const alumniRecord = nimValue ? alumniByNim.value.get(nimValue) : null
    const tahunMasuk =
      alumniRecord?.tahunMasuk ||
      pickFirstValue(formData, [
        'tahunMasuk',
        'tahun_masuk',
        'entryYear',
        'entry_year',
        'tahunMasukAlumni',
      ])
    const tahunLulus = pickFirstValue(formData, ['tahun', 'tahunLulus', 'tahun_lulus'])
    const sumberDana = pickFirstValue(formData, ['sumberDana', 'sumber_dana', 'sumber_dana_kuliah'])
    const masaTunggu = pickFirstValue(formData, [
      'bekerja_bulanDapat',
      'bekerja_bulanTidak',
      'mencari_mulaiSetelah',
      'mencari_mulaiSebelum',
    ])

    return {
      id: item.id,
      nama,
      fakultas,
      prodi,
      tahunMasuk: formatCellValue(tahunMasuk),
      tahunLulus: formatCellValue(tahunLulus),
      status: formatCellValue(
        pickFirstValue(formData, ['status', 'status_pekerjaan']) || item.status,
      ),
      sumberDana: formatCellValue(sumberDana),
      masaTunggu: formatCellValue(masaTunggu),
      raw: item.raw || item,
    }
  }),
)

const pageSize = ref(50)
const page = ref(1)
const pageSizeOptions = [50, 100, 200, 'all']
const totalRows = computed(() =>
  hasServerPagination.value ? Number(pagedMeta.value?.total || 0) : tableRows.value.length,
)
const pageSizeNumber = computed(() =>
  pageSize.value === 'all' ? totalRows.value || 0 : Number(pageSize.value) || 50,
)
const totalPages = computed(() => {
  if (pageSize.value === 'all') return 1
  return Math.max(1, Math.ceil(totalRows.value / Math.max(1, pageSizeNumber.value)))
})
const pagedRows = computed(() => {
  if (hasServerPagination.value) return tableRows.value
  if (pageSize.value === 'all') return tableRows.value
  const start = (page.value - 1) * pageSizeNumber.value
  return tableRows.value.slice(start, start + pageSizeNumber.value)
})
const pageRangeLabel = computed(() => {
  if (!totalRows.value) return '0'
  if (pageSize.value === 'all') return `1 - ${totalRows.value} dari ${totalRows.value}`
  const start = (page.value - 1) * pageSizeNumber.value + 1
  const end = Math.min(totalRows.value, start + pageSizeNumber.value - 1)
  return `${start} - ${end} dari ${totalRows.value}`
})
const setPageSize = (size) => {
  pageSize.value = size
  page.value = 1
}
const nextPage = () => {
  if (page.value < totalPages.value) page.value += 1
}
const prevPage = () => {
  if (page.value > 1) page.value -= 1
}

watch([totalRows, pageSize], () => {
  if (pageSize.value === 'all') {
    page.value = 1
    return
  }
  if (page.value > totalPages.value) {
    page.value = totalPages.value
  }
  if (page.value < 1) {
    page.value = 1
  }
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

const openFilter = ref(null)
const toggleFilter = (name) => {
  openFilter.value = openFilter.value === name ? null : name
}

const toggleStatus = (val) => {
  if (val === 'all') {
    filters.status = ['all']
    return
  }
  filters.status = filters.status.filter((s) => s !== 'all')
  if (filters.status.includes(val)) {
    filters.status = filters.status.filter((s) => s !== val)
    if (filters.status.length === 0) filters.status = ['all']
  } else {
    filters.status.push(val)
  }
}

const resetFilters = () => {
  filters.tahun = 'all'
  filters.fakultas = 'all'
  filters.prodi = 'all'
  filters.status = ['all']
  filters.questionId = ''
  filters.answerValue = ''
}

const formatExportCellValue = (value) => {
  if (value === undefined || value === null) return ''
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item ?? '').trim())
      .filter(Boolean)
      .join(';')
  }
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, val]) => `${String(key).trim()}:${String(val ?? '').trim()}`)
      .join(';')
  }
  return String(value).trim()
}

const buildGenericExportAoA = (records = []) => {
  const questionColumns = scopedQuestionFields.value
  const header = ['nama', 'nim', 'fakultas', 'prodi', 'tahun', 'status', ...questionColumns.map((q) => q.key)]
  const rows = records.map((record) => {
    const raw = record.raw || record
    const row = [
      formatExportCellValue(record.nama),
      formatExportCellValue(record.nim),
      formatExportCellValue(record.fakultas),
      formatExportCellValue(record.prodi),
      formatExportCellValue(record.tahun),
      formatExportCellValue(record.status),
    ]
    questionColumns.forEach((question) => {
      row.push(formatExportCellValue(getRawValue(raw, question.key)))
    })
    return row
  })
  return [header, ...rows]
}

const loadAllRecordsForExport = async () => {
  if (!questionnaire.value?.id) return []
  const { audience, type } = buildAudienceParams()
  await fetchSubmissions({
    questionnaireId: questionnaire.value.id,
    limit: MAX_RESPONSE_LIMIT,
    per_page: MAX_RESPONSE_LIMIT,
    all: 1,
    include_answers: 1,
    audience,
    type,
  })
  const mappedRecords = mapRecordsByAudience(submissions.items || [])
  return isRecordFilterActive.value ? filterRecords(mappedRecords) : mappedRecords
}

const exportByFormat = async (format = 'csv') => {
  exportMessage.value = isRecordFilterActive.value
    ? 'Menyiapkan data export sesuai filter...'
    : 'Menyiapkan data export semua jawaban...'
  try {
    const records = await loadAllRecordsForExport()
    if (!records.length) {
      exportMessage.value = isRecordFilterActive.value
        ? 'Tidak ada data jawaban yang sesuai filter untuk diekspor.'
        : 'Tidak ada data jawaban untuk diekspor.'
      return
    }

    const aoa =
      questionnaire.value?.audience === 'alumni'
        ? buildAlumniTemplateAoA(records, getRawValue)
        : buildGenericExportAoA(records)
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Jawaban')

    const filename = `jawaban_${questionnaireId.value}_${Date.now()}.${format}`
    if (format === 'csv') {
      XLSX.writeFile(wb, filename, { bookType: 'csv' })
    } else {
      XLSX.writeFile(wb, filename)
    }
    exportMessage.value = 'Export selesai diunduh.'
  } catch (err) {
    exportMessage.value = err?.message || 'Gagal membuat export.'
  }
}

const exportCsv = async () => {
  await exportByFormat('csv')
}

const exportExcel = async () => {
  await exportByFormat('xlsx')
}

const exportPdf = async () => {
  exportMessage.value = isRecordFilterActive.value
    ? 'Menyiapkan PDF export sesuai filter...'
    : 'Menyiapkan PDF semua jawaban...'
  try {
    const records = await loadAllRecordsForExport()
    if (!records.length) {
      exportMessage.value = isRecordFilterActive.value
        ? 'Tidak ada data jawaban yang sesuai filter untuk diekspor.'
        : 'Tidak ada data jawaban untuk diekspor.'
      return
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const margin = 36
    const pageHeight = doc.internal.pageSize.getHeight()
    const contentWidth = doc.internal.pageSize.getWidth() - margin * 2
    let y = margin
    const useTemplateLayout = questionnaire.value?.audience === 'alumni'

    const ensureSpace = (neededHeight = 20) => {
      if (y + neededHeight <= pageHeight - margin) return
      doc.addPage()
      y = margin
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Export Jawaban Alumni', margin, y)
    y += 16
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Kuisioner: ${questionnaire.value?.title || '-'}`, margin, y)
    y += 12
    doc.text(`Total responden: ${records.length}`, margin, y)
    y += 18

    records.forEach((record, index) => {
      const rowValues = useTemplateLayout ? buildAlumniTemplateDataRow(record, getRawValue) : []
      const identityText = useTemplateLayout
        ? `${index + 1}. ${rowValues[0] || '-'} (NIM: ${rowValues[2] || '-'})`
        : `${index + 1}. ${record.nama || '-'}`
      ensureSpace(18)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      doc.text(identityText, margin, y)
      y += 12
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)

      if (useTemplateLayout) {
        ALUMNI_TEMPLATE_HEADERS.forEach((key, keyIndex) => {
          const rawText = rowValues[keyIndex] || '-'
          const lines = doc.splitTextToSize(`${key}: ${rawText}`, contentWidth)
          ensureSpace(Math.max(12, lines.length * 10 + 2))
          lines.forEach((line) => {
            doc.text(line, margin + 8, y)
            y += 10
          })
        })
      } else {
        const lines = doc.splitTextToSize(
          JSON.stringify(record.raw || record, null, 2),
          contentWidth,
        )
        ensureSpace(Math.max(12, lines.length * 10 + 2))
        lines.forEach((line) => {
          doc.text(line, margin + 8, y)
          y += 10
        })
      }

      y += 6
      ensureSpace(12)
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)
      doc.line(margin, y, margin + contentWidth, y)
      y += 12
    })

    doc.save(`jawaban_${questionnaireId.value}_${Date.now()}.pdf`)
    exportMessage.value = 'Export selesai diunduh.'
  } catch (err) {
    exportMessage.value = err?.message || 'Gagal membuat PDF export.'
  }
}

const goBack = () => {
  router.push({ name: 'AdminKuisioner' })
}

const MAX_RESPONSE_LIMIT = 10000
const clampText = (value, max) => {
  const text = String(value ?? '').trim()
  if (!text) return ''
  return text.length > max ? text.slice(0, max) : text
}
const normalizeYear = (value) => {
  const text = String(value ?? '').trim()
  const match = text.match(/\b\d{4}\b/)
  return match ? match[0] : ''
}
const normalizeQuestionId = (value) => {
  const raw = String(value ?? '').trim()
  return /^\d+$/.test(raw) ? raw : ''
}
const buildAudienceParams = () => {
  const audience = questionnaire.value?.audience || targetAudience.value || 'alumni'
  const type = audience === 'pengguna' ? 'pengguna_alumni' : audience
  return { audience, type }
}
const buildFilterParams = () => {
  const statusValue = filters.status.includes('all') ? '' : filters.status.join(',')
  const questionId = normalizeQuestionId(filters.questionId)
  const { audience, type } = buildAudienceParams()
  const params = {
    questionnaire_id: questionnaire.value?.id || '',
    audience,
    type,
    fakultas: filters.fakultas !== 'all' ? clampText(filters.fakultas, 100) : '',
    prodi: filters.prodi !== 'all' ? clampText(filters.prodi, 100) : '',
    tahun: filters.tahun !== 'all' ? normalizeYear(filters.tahun) : '',
    status: clampText(statusValue, 200),
    question_id: questionId,
    answer_value: questionId ? clampText(filters.answerValue, 100) : '',
  }
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  )
}

const fetchSummary = async () => {
  if (!questionnaire.value?.id) return
  if (useClientDataMode.value) {
    summaryPayload.value = null
    summaryError.value = ''
    return
  }
  if (filters.questionId && !normalizeQuestionId(filters.questionId) && filters.answerValue) {
    summaryPayload.value = null
    summaryError.value = ''
    return
  }
  summaryLoading.value = true
  summaryError.value = ''
  try {
    const params = buildFilterParams()
    const resp = await getResponsesSummary(questionnaire.value.id, params)
    summaryPayload.value = resp?.data || resp || null
  } catch (err) {
    summaryError.value = err?.message || 'Gagal memuat ringkasan.'
    summaryPayload.value = null
  } finally {
    summaryLoading.value = false
  }
}

const fetchPagedResponses = async () => {
  if (!questionnaire.value?.id) return
  const includeAnswers = targetAudience.value === 'pengguna' || isLocalOnlyQuestionFilter.value ? 1 : 0
  if (useClientDataMode.value) {
    await fetchSubmissions({
      questionnaireId: questionnaire.value.id,
      limit: MAX_RESPONSE_LIMIT,
      per_page: MAX_RESPONSE_LIMIT,
      all: 1,
      include_answers: includeAnswers,
      ...buildFilterParams(),
    })
    return
  }
  await fetchSubmissionsPage({
    questionnaireId: questionnaire.value.id,
    page: page.value,
    per_page: pageSizeNumber.value,
    include_answers: includeAnswers,
    ...buildFilterParams(),
  })
}

const loadData = async () => {
  if (!questionnaires.value.length) {
    await fetchQuestionnaires()
  }
  if (questionnaire.value?.id) {
    fetchQuestions(questionnaire.value.id)
    await fetchPagedResponses()
    await fetchSummary()
  }
  await fetchAlumni()
}

const handleOutsideClick = () => {
  if (openFilter.value) {
    openFilter.value = null
  }
}

const setTabRef = (el, index) => {
  if (el) tabRefs.value[index] = el
}

const updateTabIndicator = () => {
  nextTick(() => {
    const index = activeTabKey.value === 'detail' ? 0 : 1
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

onMounted(() => {
  loadData()
  window.addEventListener('click', handleOutsideClick)
  updateTabIndicator()
  window.addEventListener('resize', updateTabIndicator)
})

onUnmounted(() => {
  window.removeEventListener('click', handleOutsideClick)
  window.removeEventListener('resize', updateTabIndicator)
})

watch(
  () => [
    filters.tahun,
    filters.fakultas,
    filters.prodi,
    filters.status.join(','),
    filters.questionId,
    filters.answerValue,
  ],
  () => {
    const shouldFetch = page.value === 1
    page.value = 1
    if (shouldFetch) {
      fetchPagedResponses()
    }
    fetchSummary()
  },
)

watch([page, pageSize], () => {
  if (useClientDataMode.value) return
  fetchPagedResponses()
})

watch(() => filters.status, () => {
  filters.questionId = ''
  filters.answerValue = ''
})

watch(() => filters.questionId, () => {
  filters.answerValue = ''
})

watch(() => filters.fakultas, () => {
  if (filters.fakultas === 'all') return
  if (!prodiOptions.value.includes(filters.prodi)) {
    filters.prodi = 'all'
  }
})

watch(
  () => useClientDataMode.value,
  () => {
    page.value = 1
    fetchPagedResponses()
    fetchSummary()
  },
)
</script>

<template>
  <AdminShell>
    <div class="max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Kuisioner</p>
          <h1 class="mt-1 text-2xl font-semibold text-slate-900">Detail & dashboard jawaban</h1>
          <p class="mt-1 text-xs text-slate-500">
            Lihat ringkasan jawaban tracer, filter dinamis, grafik, tabel detail, dan export.
          </p>
          <p v-if="questionnaire" class="mt-2 text-xs text-slate-600">
            Kuisioner:
            <span class="font-semibold text-slate-900">{{ questionnaire.title }}</span>
          </p>
          <p v-if="questionnaire" class="text-[11px] text-slate-500">
            Target responden:
            <span class="font-semibold text-slate-800">
              {{ questionnaire.audience === 'pengguna' ? 'Pengguna alumni' : questionnaire.audience === 'umum' ? 'Umum' : 'Alumni' }}
            </span>
          </p>
        </div>
        <button
          type="button"
          class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          @click="goBack"
        >
          Kembali ke daftar kuisioner
        </button>
      </header>

      <div
        v-if="submissionsError || pagedError || summaryError"
        class="mb-3 rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-700"
      >
        {{ submissionsError || pagedError || summaryError }}
      </div>
      <div v-if="submissionsLoading || pagedLoading || summaryLoading" class="mb-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">
        Memuat data jawaban...
      </div>

      <div
        ref="tabContainerRef"
        class="relative mb-6 inline-flex flex-wrap items-center gap-1 rounded-full bg-slate-100/80 p-1 shadow-sm shadow-slate-200/70"
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
          type="button"
          :ref="(el) => setTabRef(el, 0)"
          class="relative z-10 rounded-full px-4 py-2 text-xs font-semibold transition-colors duration-200 ease-out"
          :class="activeTabKey === 'detail' ? 'text-slate-900' : 'text-slate-500 hover:bg-white/70 hover:text-slate-900'"
        >
          Dashboard Jawaban
        </button>
        <button
          type="button"
          :ref="(el) => setTabRef(el, 1)"
          class="relative z-10 rounded-full px-4 py-2 text-xs font-semibold transition-colors duration-200 ease-out"
          :class="activeTabKey === 'questions' ? 'text-slate-900' : 'text-slate-500 hover:bg-white/70 hover:text-slate-900'"
          @click="router.push({ name: 'AdminKuisionerQuestions', params: { id: questionnaireId } })"
        >
          Manajemen Pertanyaan
        </button>
      </div>

      <div class="space-y-8">
        <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Dashboard jawaban tracer</p>
              <h2 class="text-xl font-semibold text-slate-900">Ringkasan & filter interaktif</h2>
              <p class="text-xs text-slate-500">
                Filter berdasarkan tahun, fakultas, prodi, dan status responden.
              </p>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                @click="resetFilters"
              >
                Reset filter
              </button>
              <button
                type="button"
                class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                @click="exportCsv"
              >
                Export CSV
              </button>
              <button
                type="button"
                class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                @click="exportExcel"
              >
                Export Excel
              </button>
              <button
                type="button"
                class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                @click="exportPdf"
              >
                Export PDF
              </button>
            </div>
            <p v-if="exportMessage" class="text-[11px] font-semibold text-slate-500">
              {{ exportMessage }}
            </p>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 shadow-sm">
            <div class="flex items-center gap-2">
              <svg class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span class="mr-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Filter:</span>
            </div>

            <!-- Filters: Show only if NOT Pengguna (or adapt for Pengguna if needed) -->
            <template v-if="targetAudience !== 'pengguna'">
              <select
                v-model="filters.tahun"
                class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">Semua tahun</option>
                <option v-for="item in uniqueValues.tahun" :key="item" :value="item">{{ item }}</option>
              </select>
              <select
                v-model="filters.fakultas"
                class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">Semua fakultas</option>
                <option v-for="item in uniqueValues.fakultas" :key="item" :value="item">{{ item }}</option>
              </select>
              <select
                v-model="filters.prodi"
                class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">Semua prodi</option>
                <option v-for="item in prodiOptions" :key="item" :value="item">{{ item }}</option>
              </select>

              <div class="relative">
                <button
                  type="button"
                  class="flex min-w-[140px] items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                  @click.stop="toggleFilter('status')"
                >
                  <span class="truncate">
                    {{ filters.status.includes('all') ? 'Semua status' : `${filters.status.length} Status terpilih` }}
                  </span>
                  <svg class="h-3 w-3 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  v-if="openFilter === 'status'"
                  class="absolute left-0 top-full z-[80] mt-1 w-56 rounded-xl border border-slate-100 bg-white p-2 shadow-xl ring-1 ring-black ring-opacity-5"
                  @click.stop
                >
                  <label class="flex cursor-pointer items-center gap-2 rounded-lg p-2 transition hover:bg-slate-50">
                    <input
                      type="checkbox"
                      :checked="filters.status.includes('all')"
                      class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      @change="toggleStatus('all')"
                    />
                    <span class="text-xs font-medium text-slate-700">Semua status</span>
                  </label>
                  <div class="my-1 h-px bg-slate-100"></div>
                  <div class="max-h-48 overflow-y-auto">
                    <label
                      v-for="opt in statusOptions"
                      :key="opt.value"
                      class="flex cursor-pointer items-center gap-2 rounded-lg p-2 transition hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        :checked="filters.status.includes(opt.value)"
                        class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        @change="toggleStatus(opt.value)"
                      />
                      <span class="text-xs text-slate-600">{{ opt.label }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </template>
            <!-- End Checks Filters -->

            <template v-if="availableFilterQuestions.length">
              <div v-if="targetAudience !== 'pengguna'" class="mx-1 h-6 w-px bg-slate-200"></div>
              <select
                v-model="filters.questionId"
                class="max-w-[220px] rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">-- Pertanyaan lanjutan --</option>
                <option v-for="q in availableFilterQuestions" :key="q.key" :value="q.key">
                  {{ q.label && q.label.length > 40 ? `${q.label.slice(0, 40)}...` : q.label }}
                </option>
              </select>

              <select
                v-if="filters.questionId"
                v-model="filters.answerValue"
                class="max-w-[180px] rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">-- Jawaban --</option>
                <option v-for="opt in availableFilterOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <button
                v-if="filters.questionId"
                type="button"
                class="rounded-full p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                title="Hapus filter lanjutan"
                @click="filters.questionId = ''; filters.answerValue = ''"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </template>
          </div>

          <!-- Summary Cards -->
          <div v-if="summary.isPengguna" class="mt-4 grid gap-4 md:grid-cols-3">
             <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-xs font-semibold text-slate-500">Total Perusahaan</p>
              <p class="text-2xl font-semibold text-slate-900">{{ summary.total }}</p>
            </div>
             <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-xs font-semibold text-slate-500">Industri Terbanyak</p>
              <p class="text-2xl font-semibold text-slate-900 line-clamp-1" :title="summary.topIndustry">{{ summary.topIndustry }}</p>
            </div>
             <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-xs font-semibold text-slate-500">Lokasi Terbanyak</p>
              <p class="text-2xl font-semibold text-slate-900 line-clamp-1" :title="summary.topLocation">{{ summary.topLocation }}</p>
            </div>
          </div>
          <div v-else class="mt-4 grid gap-4 md:grid-cols-4">
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-xs font-semibold text-slate-500">Total respon</p>
              <p class="text-2xl font-semibold text-slate-900">{{ summary.total }}</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-xs font-semibold text-slate-500">% bekerja/wirausaha</p>
              <p class="text-2xl font-semibold text-slate-900">{{ summary.employedPercent }}%</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-xs font-semibold text-slate-500">Masa tunggu rata-rata</p>
              <p class="text-2xl font-semibold text-slate-900">{{ summary.waitAvg }} bln</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-xs font-semibold text-slate-500">Gaji rata-rata</p>
              <p class="text-2xl font-semibold text-slate-900">{{ summary.salaryAvg }}</p>
            </div>
          </div>

          <div v-if="!summary.isPengguna" class="mt-5 grid gap-4 lg:grid-cols-2">
            <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p class="text-sm font-semibold text-slate-900">Distribusi status</p>
              <div class="mt-3 space-y-2">
                <div
                  v-for="row in summary.statusCounts"
                  :key="row.label"
                  class="flex items-center gap-3"
                >
                  <div class="flex-1 rounded-full bg-white p-1">
                    <div
                      class="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-sky-500"
                      :style="{ width: `${Math.min(100, (row.value / Math.max(1, summary.total)) * 100)}%` }"
                    />
                  </div>
                  <div class="w-28 text-xs font-semibold text-slate-600">
                    {{ row.label }} ({{ row.value }})
                  </div>
                </div>
              </div>
            </div>
            <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p class="text-sm font-semibold text-slate-900">Industri terbanyak</p>
              <p class="mt-2 text-2xl font-semibold text-slate-900">{{ summary.topIndustry }}</p>
              <p class="text-xs text-slate-500">Per sektor pada jawaban tracer.</p>
            </div>
          </div>

          <div class="mt-5 rounded-2xl border border-slate-100 bg-white">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
              <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Tabel jawaban</p>
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-[11px] font-semibold text-slate-400">Tampilkan:</span>
                <button
                  v-for="size in pageSizeOptions"
                  :key="size"
                  type="button"
                  class="rounded-full border px-3 py-1 text-[11px] font-semibold transition"
                  :class="pageSize === size ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'"
                  @click="setPageSize(size)"
                >
                  {{ size === 'all' ? 'All' : size }}
                </button>
                <div class="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-500">
                  <button
                    type="button"
                    class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="pageSize === 'all' || page <= 1"
                    @click="prevPage"
                    aria-label="Sebelumnya"
                  >
                    <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fill-rule="evenodd"
                        d="M12.78 15.53a.75.75 0 0 1-1.06 0l-5-5a.75.75 0 0 1 0-1.06l5-5a.75.75 0 1 1 1.06 1.06L8.31 10l4.47 4.47a.75.75 0 0 1 0 1.06z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>
                  <span class="px-1 text-slate-600">{{ pageRangeLabel }}</span>
                  <button
                    type="button"
                    class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="pageSize === 'all' || page >= totalPages"
                    @click="nextPage"
                    aria-label="Berikutnya"
                  >
                    <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fill-rule="evenodd"
                        d="M7.22 4.47a.75.75 0 0 1 1.06 0l5 5a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 1 1-1.06-1.06L11.69 10 7.22 5.53a.75.75 0 0 1 0-1.06z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr v-if="targetAudience === 'pengguna'">
                    <th class="px-4 py-2 text-left">Nama Perusahaan</th>
                    <th class="px-4 py-2 text-left">Bidang</th>
                    <th class="px-4 py-2 text-left">Lokasi</th>
                    <th class="px-4 py-2 text-left">Kontak</th>
                    <th class="px-4 py-2 text-left">Jabatan PIC</th>
                    <th class="px-4 py-2 text-left">Target Alumni</th>
                  </tr>
                  <tr v-else-if="targetAudience === 'umum'">
                    <template v-if="umumTableQuestions.length">
                      <th
                        v-for="question in umumTableQuestions"
                        :key="`head-${question.id}`"
                        class="px-4 py-2 text-left"
                      >
                        {{ question.label }}
                      </th>
                    </template>
                    <th v-else class="px-4 py-2 text-left">Pertanyaan</th>
                  </tr>
                  <tr v-else>
                    <th class="px-4 py-2 text-left">Nama</th>
                    <th class="px-4 py-2 text-left">Fakultas</th>
                    <th class="px-4 py-2 text-left">Prodi</th>
                    <th class="px-4 py-2 text-left">Tahun masuk</th>
                    <th class="px-4 py-2 text-left">Tahun lulus</th>
                    <th class="px-4 py-2 text-left">Status</th>
                    <th class="px-4 py-2 text-left">Sumber dana kuliah</th>
                    <th class="px-4 py-2 text-left">Masa tunggu (bln)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-700">
                  <tr v-for="row in pagedRows" :key="row.id">
                    <template v-if="targetAudience === 'pengguna'">
                        <td class="px-4 py-2">{{ row.nama }}</td>
                        <td class="px-4 py-2">{{ row.prodi }}</td>
                        <td class="px-4 py-2">{{ row.fakultas }}</td>
                        <td class="px-4 py-2">{{ row.kontak }}</td>
                        <td class="px-4 py-2">{{ row.jabatan }}</td>
                        <td class="px-4 py-2 font-medium text-slate-900">{{ row.namaAlumni }}</td>
                    </template>
                    <template v-else-if="targetAudience === 'umum'">
                        <template v-if="umumTableQuestions.length">
                          <td
                            v-for="question in umumTableQuestions"
                            :key="`row-${row.id}-${question.id}`"
                            class="px-4 py-2"
                          >
                            {{ formatQuestionAnswerCell(row, question.key) }}
                          </td>
                        </template>
                        <td v-else class="px-4 py-2">-</td>
                    </template>
                    <template v-else>
                        <td class="px-4 py-2">{{ row.nama }}</td>
                        <td class="px-4 py-2">{{ row.fakultas }}</td>
                        <td class="px-4 py-2">{{ row.prodi }}</td>
                        <td class="px-4 py-2">{{ row.tahunMasuk }}</td>
                        <td class="px-4 py-2">{{ row.tahunLulus }}</td>
                        <td class="px-4 py-2 capitalize">{{ row.status || '-' }}</td>
                        <td class="px-4 py-2">{{ row.sumberDana }}</td>
                        <td class="px-4 py-2">{{ row.masaTunggu }}</td>
                    </template>
                  </tr>
                  <tr v-if="!pagedRows.length">
                    <td
                      :colspan="targetAudience === 'pengguna' ? 6 : targetAudience === 'umum' ? Math.max(1, umumTableQuestions.length) : 8"
                      class="px-4 py-3 text-center text-xs text-slate-500"
                    >
                      Belum ada data tracer yang sesuai filter.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  </AdminShell>
  <LoadingOverlay :active="submissionsLoading || pagedLoading || summaryLoading" />
</template>
