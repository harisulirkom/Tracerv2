<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAlumni } from '../stores/alumni'
import { useAuth } from '../stores/auth'
import { useUserManagement } from '../stores/userManagement'
import AdminShell from '../components/AdminShell.vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import {
  blastEmail,
  generateSurveyLink,
  getBlastEmailProgress,
  getEmailTemplate,
  updateEmailTemplate,
} from '../services/alumniBlastService'

const router = useRouter()
const {
  alumni,
  fetchAlumni,
  addAlumni,
  updateAlumni,
  exportAlumniCsv,
  markSent,
  importAlumniCsv,
  previewImportFile,
  getImportProgress,
} = useAlumni()
const auth = useAuth()
const { permissions } = useUserManagement()
const defaultAvatar = 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=240&q=60'

const search = ref('')
const fakultasFilter = ref('all')
const prodiFilter = ref('all')
const tahunFilter = ref('all')
const statusFilter = ref('all')
const selectedAlumni = ref(null)
const selectedIds = ref([])
const message = ref('')
const error = ref('')
const importLoading = ref(false)
const importStatus = ref('')
const importProgress = ref(0)
const importProgressLabel = ref('')
const selectedImportFile = ref(null)
const selectedImportFileName = ref('')
const selectedImportFileRows = ref(0)
const importReview = ref(null)
const normalizedEmailCount = ref(0)
const importFailedReportUrl = ref('')
const importMode = ref('smart')
const importPreview = ref(null)
const importPreviewLoading = ref(false)
const importModalOpen = ref(false)
const importInput = ref(null)
const showDetailModal = ref(false)
const showSiakadWarning = ref(false)
const emailTemplateOpen = ref(false)
const sendLinkMenuOpen = ref(false)
const blastLoading = ref(false)
const pageLoading = computed(() => alumni.value.loading || importLoading.value)
const blastProgress = ref(null)
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 hari
const pageSizeOptions = ['all', 10, 50, 100, 200]
const pageSize = ref(10)
const currentPage = ref(1)
const hasApi = Boolean(import.meta.env.VITE_API_BASE_URL)
const BLAST_LOGO_STORAGE_KEY = 'cdc_alumni_blast_logo_url'
const defaultBlastLogoUrl = `${window.location.origin}/CDC.svg`
const blastLogoUrl = ref(defaultBlastLogoUrl)
const emailSubject = ref('Tracer Study Alumni - CDC UIN Kediri')
const templateSaving = ref(false)
const editModalOpen = ref(false)
const editDraft = ref({})
const editSaving = ref(false)
const editError = ref('')
const syncLoading = ref(false)
const confirmSaveOpen = ref(false)
const confirmTemplateSaveOpen = ref(false)
const BLAST_PROGRESS_INTERVAL_MS = 1500
const BLAST_PROGRESS_MAX_ATTEMPTS = 240
const blastProgressPercent = computed(() => {
  if (!blastProgress.value) return 0
  const total = Number(blastProgress.value.total || 0)
  const processed = Number(blastProgress.value.processed || 0)
  if (total <= 0) return 0
  return Math.max(0, Math.min(100, Math.floor((processed / total) * 100)))
})

const currentRole = computed(() => auth.user.value?.role || '')
const rolePermissions = computed(() => permissions?.[currentRole.value] || {})
const isSuperAdmin = computed(() => currentRole.value === 'Super Admin')
const canEditAlumni = computed(() => isSuperAdmin.value || !!rolePermissions.value?.alumniEdit)

const normalizeDateInput = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) return raw
  const dmyMatch = raw.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/)
  if (!dmyMatch) return ''
  const day = Number(dmyMatch[1])
  const month = Number(dmyMatch[2])
  const year = Number(dmyMatch[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return ''
  }
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

const goBack = () => {
  router.push('/admin')
}

const setSelection = (item) => {
  selectedAlumni.value = item
}

onMounted(async () => {
  try {
    const savedLogo = localStorage.getItem(BLAST_LOGO_STORAGE_KEY)
    if (savedLogo && savedLogo.trim()) blastLogoUrl.value = savedLogo.trim()
  } catch (e) {
    // ignore storage errors
  }
  await loadEmailSettings()
  await fetchAlumni({}, { forceRemote: true })
})

const fakultasOptions = computed(() => [
  'all',
  ...new Set(alumni.value.items.map((item) => item.fakultas).filter(Boolean)),
])

const prodiOptions = computed(() => [
  'all',
  ...new Set(
    alumni.value.items
      .filter((item) => fakultasFilter.value === 'all' || item.fakultas === fakultasFilter.value)
      .map((item) => item.prodi)
      .filter(Boolean),
  ),
])

const tahunOptions = computed(() =>
  ['all'].concat(
    [...new Set(alumni.value.items.map((item) => item.tahunLulus).filter(Boolean))].sort((a, b) => b - a),
  ),
)

const filteredAlumni = computed(() => {
  const term = search.value.trim().toLowerCase()
  return alumni.value.items.filter((item) => {
    const matchTerm =
      !term ||
      item.nama.toLowerCase().includes(term) ||
      item.nim.toLowerCase().includes(term) ||
      item.prodi.toLowerCase().includes(term) ||
      item.fakultas.toLowerCase().includes(term) ||
      String(item.tahunLulus).includes(term)
    const matchFakultas = fakultasFilter.value === 'all' || item.fakultas === fakultasFilter.value
    const matchProdi = prodiFilter.value === 'all' || item.prodi === prodiFilter.value
    const matchTahun = tahunFilter.value === 'all' || String(item.tahunLulus) === String(tahunFilter.value)
    const matchStatus =
      statusFilter.value === 'all' ||
      (statusFilter.value === 'sent' && item.sent) ||
      (statusFilter.value === 'unsent' && !item.sent)
    return matchTerm && matchFakultas && matchProdi && matchTahun && matchStatus
  })
})

const totalPages = computed(() => {
  if (pageSize.value === 'all') return 1
  return Math.max(1, Math.ceil(filteredAlumni.value.length / Number(pageSize.value || 1)))
})

const paginatedAlumni = computed(() => {
  if (pageSize.value === 'all') return filteredAlumni.value
  const size = Number(pageSize.value || 1)
  const start = (currentPage.value - 1) * size
  return filteredAlumni.value.slice(start, start + size)
})

watch([filteredAlumni, pageSize], () => {
  currentPage.value = 1
})

watch(fakultasFilter, () => {
  if (prodiFilter.value !== 'all' && !prodiOptions.value.includes(prodiFilter.value)) {
    prodiFilter.value = 'all'
  }
})

watch(currentPage, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
  if (currentPage.value < 1) {
    currentPage.value = 1
  }
})

const hasActiveAlumniFilter = computed(() =>
  search.value.trim() !== '' ||
  fakultasFilter.value !== 'all' ||
  prodiFilter.value !== 'all' ||
  tahunFilter.value !== 'all' ||
  statusFilter.value !== 'all',
)

const totalAlumni = computed(() => {
  if (hasActiveAlumniFilter.value) {
    return filteredAlumni.value.length
  }

  const metaTotal = alumni.value.meta?.total
  if (typeof metaTotal === 'number' && metaTotal >= 0) {
    return metaTotal
  }
  return alumni.value.items.length
})
const totalFakultas = computed(() => new Set(filteredAlumni.value.map((item) => item.fakultas)).size)
const allSelected = computed(
  () => paginatedAlumni.value.length > 0 && paginatedAlumni.value.every((item) => selectedIds.value.includes(item.nim)),
)
const selectedAlumniList = computed(() =>
  alumni.value.items.filter((item) => selectedIds.value.includes(item.nim)),
)

const isEmailMissing = (item) => {
  const value = String(item?.email || '').trim()
  if (!value) return true
  return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

const getStatusLabel = (item) => {
  if (item.sent) return 'Sudah terkirim'
  if (isEmailMissing(item)) return 'Tidak terkirim'
  return 'Belum terkirim'
}

const getStatusTextClass = (item) => {
  if (item.sent) return 'text-emerald-600'
  if (isEmailMissing(item)) return 'text-rose-600'
  return 'text-amber-600'
}

const getStatusClass = (item) => {
  if (item.sent) return 'bg-emerald-50 text-emerald-600'
  if (isEmailMissing(item)) return 'bg-rose-50 text-rose-600'
  return 'bg-amber-50 text-amber-600'
}

const toggleStatusFilter = (status) => {
  statusFilter.value = statusFilter.value === status ? 'all' : status
}

const startDetail = (item) => {
  setSelection(item)
  showDetailModal.value = true
  message.value = ''
  error.value = ''
}

const closeDetail = () => {
  showDetailModal.value = false
}

const buildEditDraft = (item) => ({
  id: item?.id ?? item?.nim ?? '',
  nama: item?.nama || '',
  nim: item?.nim || '',
  prodi: item?.prodi || '',
  fakultas: item?.fakultas || '',
  tahunMasuk: item?.tahunMasuk || '',
  tahunLulus: item?.tahunLulus || '',
  email: item?.email || '',
  nik: item?.rawNik || item?.nik || '',
  noHp: item?.rawNoHp || item?.noHp || '',
  alamat: item?.rawAlamat || item?.alamat || '',
  dob: normalizeDateInput(item?.dob || ''),
  foto: item?.foto || '',
})

const openEdit = (item) => {
  if (!canEditAlumni.value) return
  editDraft.value = buildEditDraft(item)
  editError.value = ''
  editModalOpen.value = true
}

const closeEdit = () => {
  editModalOpen.value = false
  editError.value = ''
  confirmSaveOpen.value = false
}

const buildUpdatePayload = (draft) => {
  const payload = {}
  const nama = String(draft?.nama || '').trim()
  const nim = String(draft?.nim || '').trim()
  const prodi = String(draft?.prodi || '').trim()
  const fakultas = String(draft?.fakultas || '').trim()
  const email = String(draft?.email || '').trim()
  const nik = String(draft?.nik || '').trim()
  const noHp = String(draft?.noHp || '').trim()
  const alamat = String(draft?.alamat || '').trim()
  const dobInput = String(draft?.dob || '').trim()
  const dob = normalizeDateInput(dobInput)
  const foto = String(draft?.foto || '').trim()
  const tahunMasuk = String(draft?.tahunMasuk || '').trim()
  const tahunLulus = String(draft?.tahunLulus || '').trim()

  if (nama) payload.nama = nama
  if (nim) payload.nim = nim
  if (prodi) payload.prodi = prodi
  if (fakultas) payload.fakultas = fakultas
  if (email) payload.email = email
  if (nik) {
    payload.nik = nik
    payload.rawNik = nik
  }
  if (noHp) {
    payload.noHp = noHp
    payload.no_hp = noHp
    payload.rawNoHp = noHp
  }
  if (alamat) {
    payload.alamat = alamat
    payload.rawAlamat = alamat
  }
  if (dob) {
    payload.dob = dob
    payload.tanggal_lahir = dob
  }
  if (foto) payload.foto = foto
  if (tahunMasuk) {
    const yearIn = Number(tahunMasuk)
    if (!Number.isNaN(yearIn)) {
      payload.tahunMasuk = yearIn
      payload.tahun_masuk = yearIn
    }
  }
  if (tahunLulus) {
    const yearOut = Number(tahunLulus)
    if (!Number.isNaN(yearOut)) {
      payload.tahunLulus = yearOut
      payload.tahun_lulus = yearOut
    }
  }

  return payload
}

const refreshSelectedAlumni = (id) => {
  const updated = alumni.value.items.find(
    (item) => String(item.id) === String(id) || String(item.nim) === String(id),
  )
  if (updated) {
    selectedAlumni.value = updated
  }
}

const saveEdit = async () => {
  if (!editDraft.value?.id) return
  editSaving.value = true
  editError.value = ''
  const dobInput = String(editDraft.value?.dob || '').trim()
  if (dobInput && !normalizeDateInput(dobInput)) {
    editError.value = 'Format tanggal lahir tidak valid.'
    editSaving.value = false
    return
  }
  try {
    const payload = buildUpdatePayload(editDraft.value)
    await updateAlumni(editDraft.value.id, payload)
    await fetchAlumni({}, { forceRemote: true })
    refreshSelectedAlumni(editDraft.value.id)
    message.value = 'Data alumni berhasil diperbarui.'
    closeEdit()
  } catch (e) {
    const statusCode = e?.response?.status
    const detail = e?.response?.data?.message || e?.message || 'Gagal memperbarui data alumni.'
    editError.value = statusCode ? `[${statusCode}] ${detail}` : detail
  } finally {
    editSaving.value = false
  }
}

const requestSaveEdit = () => {
  if (editSaving.value) return
  confirmSaveOpen.value = true
}

const closeSaveConfirm = () => {
  confirmSaveOpen.value = false
}

const confirmSaveEdit = async () => {
  confirmSaveOpen.value = false
  await saveEdit()
}

const canSyncAlumni = (item) => {
  if (!canEditAlumni.value) return false
  if (!item) return false
  const rawNik = String(item.rawNik || '').trim()
  const rawNoHp = String(item.rawNoHp || '').trim()
  const rawAlamat = String(item.rawAlamat || '').trim()
  return Boolean(rawNik || rawNoHp || rawAlamat)
}

const syncAlumni = async (item) => {
  if (!item || !canEditAlumni.value) return
  if (!canSyncAlumni(item)) {
    error.value = 'Tidak ada data asli untuk disinkronkan. Gunakan menu edit untuk melengkapi.'
    return
  }
  syncLoading.value = true
  error.value = ''
  try {
    const payload = buildUpdatePayload({
      nik: item.rawNik,
      noHp: item.rawNoHp,
      alamat: item.rawAlamat,
    })
    await updateAlumni(item.id || item.nim, payload)
    refreshSelectedAlumni(item.id || item.nim)
    message.value = 'Data alumni berhasil disinkronkan ke database.'
  } catch (e) {
    const detail = e?.response?.data?.message || e?.message || 'Gagal menyinkronkan data alumni.'
    error.value = detail
  } finally {
    syncLoading.value = false
  }
}

const handleExport = () => {
  exportAlumniCsv(filteredAlumni.value)
}

const toggleSelect = (id) => {
  const set = new Set(selectedIds.value)
  if (set.has(id)) {
    set.delete(id)
  } else {
    set.add(id)
  }
  selectedIds.value = [...set]
}

const toggleSelectAll = () => {
  const set = new Set(selectedIds.value)
  const idsOnPage = paginatedAlumni.value.map((item) => item.nim)
  const alreadyAll = idsOnPage.every((id) => set.has(id))
  if (alreadyAll) {
    idsOnPage.forEach((id) => set.delete(id))
  } else {
    idsOnPage.forEach((id) => set.add(id))
  }
  selectedIds.value = [...set]
}

const handleImportClick = () => {
  message.value = ''
  error.value = ''
  importStatus.value = ''
  resetImportState()
  importModalOpen.value = true
}

const importLocallyFromText = (text) => {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  if (!lines.length) {
    throw new Error('File import kosong.')
  }

  const rows = lines.slice(1)

  if (rows.length > 5000) {
    throw new Error(`Data terlalu banyak (${rows.length} baris). Maksimal 5000 baris per upload.`)
  }
  let imported = 0

  rows.forEach((line) => {
    const cols = line
      .split(',')
      .map((col) => col.replace(/^"|"$/g, '').replace(/""/g, '"').trim())
    if (cols.length >= 10) {
      let nama = ''
      let nim = ''
      let prodi = ''
      let fakultas = ''
      let tahunLulus = ''
      let tahunMasuk = ''
      let email = ''
      let nik = ''
      let noHp = ''
      let alamat = ''
      let dob = ''
      let foto = ''

      if (cols.length >= 11) {
        ;[
          nama,
          nim,
          prodi,
          fakultas,
          tahunLulus,
          tahunMasuk,
          email,
          nik,
          noHp,
          alamat,
          dob,
          foto,
        ] = cols
      } else {
        ;[nama, nim, prodi, fakultas, tahunLulus, tahunMasuk, nik, noHp, alamat, dob, foto] = cols
      }

      addAlumni({ nama, nim, prodi, fakultas, tahunLulus, tahunMasuk, email, nik, noHp, alamat, dob, foto })
      imported += 1
    }
  })

  if (!imported) {
    throw new Error('Tidak ada baris valid pada file import. Pastikan minimal 11 kolom diisi (termasuk Email).')
  }

  return imported
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const updateImportProgress = (percent, label = '') => {
  importProgress.value = Math.max(0, Math.min(100, Number(percent || 0)))
  importProgressLabel.value = label
}

const resetImportState = () => {
  selectedImportFile.value = null
  selectedImportFileName.value = ''
  selectedImportFileRows.value = 0
  importReview.value = null
  normalizedEmailCount.value = 0
  importFailedReportUrl.value = ''
  importPreview.value = null
  importPreviewLoading.value = false
  importMode.value = 'smart'
  updateImportProgress(0, '')
}

const detectImportFileKind = (file) => {
  const name = String(file?.name || '').toLowerCase()
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return 'xlsx'
  return 'csv'
}

const estimateCsvRows = async (file) => {
  if (detectImportFileKind(file) === 'xlsx') {
    return 0
  }
  try {
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '')
    return Math.max(0, lines.length - 1)
  } catch (e) {
    return 0
  }
}

const runImportPreflight = async (file) => {
  if (!hasApi || !file) {
    importPreview.value = null
    return
  }

  importPreviewLoading.value = true
  try {
    const resp = await previewImportFile(file, { mode: importMode.value })
    const preview = resp?.preview || resp?.data?.preview || null
    importPreview.value = preview
    if (preview?.total_rows > 0) {
      selectedImportFileRows.value = Number(preview.total_rows || 0)
    }
  } catch (e) {
    importPreview.value = null
    const status = e?.response?.status
    if (status === 404 || status === 405) {
      error.value = 'Fitur preview belum tersedia di backend server ini. Silakan update backend ke versi terbaru.'
    }
  } finally {
    importPreviewLoading.value = false
  }
}

const parseCsvText = (text) => {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"'
        i += 1
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
      continue
    }

    if (ch === ',') {
      row.push(field)
      field = ''
      continue
    }

    if (ch === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      continue
    }

    if (ch !== '\r') {
      field += ch
    }
  }

  row.push(field)
  rows.push(row)

  return rows.filter((r) => r.some((value) => String(value || '').trim() !== ''))
}

const toCsvText = (rows) =>
  rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value ?? '')
          if (/[",\n\r]/.test(text)) {
            return `"${text.replace(/"/g, '""')}"`
          }
          return text
        })
        .join(','),
    )
    .join('\n')

const normalizeImportCsvFile = async (file) => {
  const raw = await file.text()
  const rows = parseCsvText(raw)
  if (rows.length < 2) {
    return { file, normalized: false, replacedEmails: 0 }
  }

  const headers = rows[0].map((h) => String(h || '').trim().toLowerCase().replace(/\s+/g, '_'))
  const nimIndex = headers.findIndex((h) => h === 'nim')
  const emailIndex = headers.findIndex((h) => h === 'email' || h === 'email_address' || h === 'mail')
  if (nimIndex < 0 || emailIndex < 0) {
    return { file, normalized: false, replacedEmails: 0 }
  }

  const emailOwner = new Map()
  const emailCount = new Map()
  let replacedEmails = 0

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i]
    const email = String(row[emailIndex] || '').trim().toLowerCase()
    if (!email) continue
    emailCount.set(email, Number(emailCount.get(email) || 0) + 1)
  }

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i]
    const nim = String(row[nimIndex] || '').trim()
    if (!nim) continue
    const rawEmail = String(row[emailIndex] || '').trim().toLowerCase()
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)
    const isRepeatedEmail = Number(emailCount.get(rawEmail) || 0) > 1
    const owner = rawEmail ? emailOwner.get(rawEmail) : null

    let nextEmail = rawEmail
    if (!isEmailValid || isRepeatedEmail || (owner && owner !== nim)) {
      const nimBase = nim.toLowerCase().replace(/[^a-z0-9]/g, '') || `alumni${i}`
      nextEmail = `${nimBase}@import.local`
      if (emailOwner.has(nextEmail) && emailOwner.get(nextEmail) !== nim) {
        nextEmail = `${nimBase}+${i}@import.local`
      }
      replacedEmails += 1
    }

    row[emailIndex] = nextEmail
    emailOwner.set(nextEmail, nim)
  }

  if (!replacedEmails) {
    return { file, normalized: false, replacedEmails: 0 }
  }

  const normalizedText = toCsvText(rows)
  const normalizedBlob = new Blob(['\uFEFF', normalizedText], { type: 'text/csv;charset=utf-8;' })
  const normalizedFile = new File([normalizedBlob], file.name, { type: 'text/csv;charset=utf-8;' })
  return {
    file: normalizedFile,
    normalized: true,
    replacedEmails,
  }
}

const onImportFileSelected = async (event) => {
  const file = event.target?.files?.[0]
  if (!file) return
  selectedImportFile.value = file
  selectedImportFileName.value = file.name
  selectedImportFileRows.value = await estimateCsvRows(file)
  importStatus.value = 'File dipilih. Klik "Upload ke sistem" untuk memulai import.'
  message.value = ''
  error.value = ''
  importReview.value = null
  normalizedEmailCount.value = 0
  importFailedReportUrl.value = ''
  importPreview.value = null
  const rowLabel = selectedImportFileRows.value > 0 ? ` (${selectedImportFileRows.value} baris terdeteksi)` : ''
  updateImportProgress(0, `Siap upload${rowLabel}.`)
  await runImportPreflight(file)
}

watch(importMode, async () => {
  if (!selectedImportFile.value || importLoading.value) return
  await runImportPreflight(selectedImportFile.value)
})

const waitImportProgressCompletion = async (importId) => {
  if (!importId) {
    return null
  }

  const maxAttempts = 900 // ~15 menit (interval 1 detik), aman untuk file >1000 baris
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const progress = await alumniStoreProgress(importId)
    if (!progress) {
      await delay(1000)
      continue
    }

    const status = String(progress.status || '').toLowerCase()
    const percent = Number(progress.percentage || 0)
    const done = Number(progress.success_count || 0)
    const total = Number(progress.total_rows || 0)
    const phase = status === 'completed' ? 'Selesai memproses data...' : 'Memproses data di server...'
    updateImportProgress(percent, total > 0 ? `${phase} ${done}/${total}` : phase)

    if (status === 'completed') {
      updateImportProgress(100, total > 0 ? `Import selesai: ${done}/${total} baris berhasil.` : 'Import selesai diproses.')
      return progress
    }

    if (status === 'failed') {
      throw new Error(progress.message || 'Import gagal diproses di server.')
    }

    await delay(1000)
  }

  return null
}

const alumniStoreProgress = async (importId) => {
  try {
    return await getImportProgress(importId)
  } catch (e) {
    const status = e?.response?.status
    if (status === 404) return null
    throw e
  }
}

const syncImportedAlumni = async ({ beforeNims, jobStatus }) => {
  const queued = String(jobStatus || '').toLowerCase() === 'queued'
  const attempts = queued ? 180 : 4
  const intervalMs = queued ? 2500 : 700

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await fetchAlumni({}, { forceRemote: true })
    const hasNewData = alumni.value.items.some((item) => !beforeNims.has(String(item.nim || '')))
    if (hasNewData || !queued) {
      return { synced: true, hasNewData }
    }
    await delay(intervalMs)
  }

  return { synced: false, hasNewData: false }
}

const startImportUpload = async () => {
  const sourceFile = selectedImportFile.value
  let file = sourceFile
  if (!file) return
  importLoading.value = true
  message.value = ''
  error.value = ''
  importReview.value = null
  normalizedEmailCount.value = 0
  importFailedReportUrl.value = ''
  importStatus.value = 'Memulai upload file...'
  updateImportProgress(0, 'Menyiapkan upload...')

  try {
    let review = null
    let failedReportUrl = ''
    let autoFixedFromServer = 0
    const kind = detectImportFileKind(sourceFile)
    if (kind === 'csv') {
      const normalized = await normalizeImportCsvFile(sourceFile)
      file = normalized.file
      normalizedEmailCount.value = Number(normalized.replacedEmails || 0)
      if (normalized.normalized && normalized.replacedEmails > 0) {
        importStatus.value = `File dinormalisasi: ${normalized.replacedEmails} email duplikat/tidak valid diperbaiki otomatis.`
        updateImportProgress(2, 'File dinormalisasi. Menyiapkan upload...')
      }
    }

    if (hasApi) {
      const beforeNims = new Set(alumni.value.items.map((item) => String(item.nim || '')))
      const response = await importAlumniCsv(file, {
        mode: importMode.value,
        onUploadProgress: (eventPayload) => {
          const total = Number(eventPayload?.total || 0)
          const loaded = Number(eventPayload?.loaded || 0)
          if (total <= 0) return
          const percent = Math.round((loaded / total) * 100)
          updateImportProgress(Math.min(99, percent), `Mengunggah file... ${percent}%`)
        },
      })
      const payload = response?.data || response || {}
      if (payload?.preflight) {
        importPreview.value = payload.preflight
      }

      updateImportProgress(100, 'Upload selesai. Memproses data di server...')

      if (!payload?.import_id) {
        throw new Error(
          'Respons backend tidak menyertakan import_id. Endpoint import belum versi terbaru. Jalankan update backend, clear cache, dan restart service.',
        )
      }

      const importId = payload.import_id
      const initialSummary = payload.summary || {}
      const totalFromResponse = Number(initialSummary.total_rows || 0)
      const doneFromResponse = Number(initialSummary.success_count || 0)
      const failFromResponse = Number(initialSummary.error_count || 0)

      if (importId) {
        const progressResult = await waitImportProgressCompletion(importId)
        if (progressResult && String(progressResult.status || '').toLowerCase() === 'completed') {
          const done = Number(progressResult.success_count || 0)
          const errors = Number(progressResult.error_count || 0)
          autoFixedFromServer = Number(progressResult.auto_fixed_email_count || 0)
          const processed = Number(progressResult.processed_rows || done + errors || 0)
          failedReportUrl =
            progressResult.failed_report_url ||
            (errors > 0 ? `/api/admin/alumni/import-report/${encodeURIComponent(importId)}` : '')
          review = {
            total: Number(progressResult.total_rows || processed || 0),
            processed,
            success: done,
            failed: errors,
          }
        }
      } else {
        const processed = Number(initialSummary.processed_rows || doneFromResponse + failFromResponse || 0)
        autoFixedFromServer = Number(initialSummary.auto_fixed_email_count || 0)
        failedReportUrl =
          initialSummary.failed_report_url ||
          (failFromResponse > 0 && importId ? `/api/admin/alumni/import-report/${encodeURIComponent(importId)}` : '')
        review = {
          total: totalFromResponse || processed,
          processed,
          success: doneFromResponse,
          failed: failFromResponse,
        }
      }

      const syncResult = await syncImportedAlumni({
        beforeNims,
        jobStatus: payload?.job_status,
      })

      if (syncResult.synced) {
        currentPage.value = 1
        if (syncResult.hasNewData) {
          search.value = ''
          fakultasFilter.value = 'all'
          prodiFilter.value = 'all'
          tahunFilter.value = 'all'
        }
        importStatus.value = 'Data alumni berhasil disegarkan otomatis.'
      } else {
        importStatus.value = 'Import berjalan di background. Data akan muncul setelah proses queue selesai.'
      }

      const summaryErrors = initialSummary.errors
      if (summaryErrors?.length) {
        error.value = summaryErrors.map((item) => item.message).join('; ')
      } else {
        error.value = ''
      }

      if (autoFixedFromServer > 0) {
        normalizedEmailCount.value = Math.max(normalizedEmailCount.value, autoFixedFromServer)
      }

      if (!review || (!review.total && !review.processed && !review.success && !review.failed)) {
        const afterCount = Number(alumni.value.meta?.total || alumni.value.items?.length || 0)
        const beforeCount = beforeNims.size
        const estimatedTotal = Number(selectedImportFileRows.value || 0)
        const estimatedSuccess = Math.max(0, afterCount - beforeCount)
        const estimatedFailed = estimatedTotal > 0 ? Math.max(0, estimatedTotal - estimatedSuccess) : 0
        review = {
          total: estimatedTotal,
          processed: estimatedTotal || estimatedSuccess,
          success: estimatedSuccess,
          failed: estimatedFailed,
          estimated: true,
        }
      }
    } else {
      const text = await file.text()
      const imported = importLocallyFromText(text)
      error.value = ''
      updateImportProgress(100, 'Import lokal selesai.')
      review = {
        total: imported,
        processed: imported,
        success: imported,
        failed: 0,
      }
    }

    if (review) {
      importReview.value = review
      importFailedReportUrl.value = failedReportUrl
      message.value = `Review import: ${review.success} berhasil, ${review.failed} gagal.`
    } else {
      message.value = 'Import selesai diproses.'
    }
  } catch (e) {
    const statusCode = e?.response?.status
    const serverMessage = e?.response?.data?.message
    const validationErrors = e?.response?.data?.errors
    let detail = serverMessage
    if (!detail && validationErrors && typeof validationErrors === 'object') {
      detail = Object.entries(validationErrors)
        .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(', ') : value}`)
        .join('; ')
    }

    const fallback = detail || e?.message || 'Gagal mengimport data alumni.'
    error.value = statusCode ? `[${statusCode}] ${fallback}` : fallback
    message.value = ''
    importStatus.value = ''
    importFailedReportUrl.value = ''
  } finally {
    importLoading.value = false
  }
}

const openManualImport = () => {
  importStatus.value = ''
  error.value = ''
  message.value = ''
  importReview.value = null
  importPreview.value = null
  normalizedEmailCount.value = 0
  selectedImportFile.value = null
  selectedImportFileName.value = ''
  selectedImportFileRows.value = 0
  updateImportProgress(0, 'Pilih file CSV untuk diupload.')
  if (importInput.value) {
    importInput.value.value = ''
  }
  importInput.value?.click()
}

const importFromSiakad = async () => {
  importLoading.value = true
  error.value = ''
  message.value = ''
  importStatus.value = 'Menghubungkan ke SIAKAD (simulasi)...'
  const simulated = [
    {
      nama: 'SIAKAD - Ahmad Fauzi',
      nim: 'SIAKAD-2024001',
      prodi: 'Teknik Industri',
      fakultas: 'Teknik',
      tahunLulus: 2024,
      tahunMasuk: 2020,
      nik: '320190100001',
      noHp: '081234560001',
      alamat: 'Jl. SIAKAD No. 1',
      dob: '1999-02-11',
      foto: '',
    },
    {
      nama: 'SIAKAD - Siti Rahmah',
      nim: 'SIAKAD-2024002',
      prodi: 'Manajemen',
      fakultas: 'Ekonomi',
      tahunLulus: 2023,
      tahunMasuk: 2019,
      nik: '320190100002',
      noHp: '081234560002',
      alamat: 'Jl. SIAKAD No. 2',
      dob: '1998-09-03',
      foto: '',
    },
    {
      nama: 'SIAKAD - Bima Prakoso',
      nim: 'SIAKAD-2024003',
      prodi: 'Hukum',
      fakultas: 'Hukum',
      tahunLulus: 2022,
      tahunMasuk: 2018,
      nik: '320190100003',
      noHp: '081234560003',
      alamat: 'Jl. SIAKAD No. 3',
      dob: '1997-06-21',
      foto: '',
    },
  ]
  try {
    await new Promise((resolve) => setTimeout(resolve, 1200))
    const existing = new Set(alumni.value.items.map((item) => String(item.nim)))
    let added = 0
    simulated.forEach((item) => {
      if (!existing.has(String(item.nim))) {
        addAlumni(item)
        added += 1
      }
    })
    importStatus.value = 'API resmi SIAKAD belum tersedia. Simulasi import berhasil dijalankan.'
    message.value = added ? `${added} data alumni dummy ditambahkan.` : 'Data simulasi sudah pernah ditambahkan.'
  } catch (e) {
    importStatus.value = ''
    error.value = e?.message || 'Gagal mensimulasikan import.'
  } finally {
    importLoading.value = false
  }
}

const closeImportModal = () => {
  importModalOpen.value = false
  resetImportState()
}

const confirmImportReview = async () => {
  importStatus.value = 'Menyegarkan halaman...'
  await fetchAlumni({}, { forceRemote: true })
  window.location.reload()
}

const openSiakadWarning = () => {
  showSiakadWarning.value = true
}

const openSiakadSyncPlaceholder = () => {
  message.value = ''
  error.value = ''
  openSiakadWarning()
}

const closeSiakadWarning = () => {
  showSiakadWarning.value = false
}

const downloadTemplateCsv = async () => {
  try {
    const headers = [
      'Nama',
      'NIM',
      'Prodi',
      'Fakultas',
      'Tahun Lulus',
      'Tahun Masuk',
      'Email',
      'NIK',
      'No HP',
      'Alamat',
      'Tanggal Lahir',
      'Foto',
    ]

    const sampleData = [
      [
        'SITI NURHAFIDHATUN UMAYAH',
        '200102001',
        'Informatika',
        'Teknik',
        '2023',
        '2019',
        'siti.umayah@example.com',
        '3201012001990001',
        '081234567001',
        'Jl. Merdeka No. 12, Bandung',
        '1999-01-10',
        'https://example.com/foto1.jpg',
      ],
      [
        'Rizky Pratama',
        '200102014',
        'Sistem Informasi',
        'Teknik',
        '2022',
        '2018',
        'rizky.pratama@example.com',
        '3201012014980001',
        '081234567014',
        'Jl. Kenari No. 8, Jakarta',
        '1998-11-05',
        '',
      ],
      [
        'Mega Lestari',
        '200103019',
        'Teknik Sipil',
        'Teknik',
        '2020',
        '2016',
        'mega.lestari@example.com',
        '3201013019960001',
        '081234567019',
        'Jl. Gatot Subroto No. 88, Bandung',
        '1996-12-11',
        'https://example.com/foto3.jpg',
      ],
    ]

    const csvContent = [headers.join(',')]
      .concat(
        sampleData.map((row) =>
          row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',')
        )
      )
      .join('\n')

    const isDownloaded = tryDownload(csvContent)
    if (isDownloaded) {
      message.value = 'Template CSV berhasil diunduh.'
      setTimeout(() => {
        message.value = ''
      }, 4000)
      return
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(csvContent)
      message.value = 'Download diblokir browser. Template CSV disalin ke clipboard sebagai fallback.'
      setTimeout(() => {
        message.value = ''
      }, 5000)
      return
    }

    showCsvTextarea(csvContent)
  } catch (err) {
    console.error('Gagal generate template CSV:', err)
    error.value = 'Gagal generate template: ' + (err?.message || 'Unknown error')
    setTimeout(() => {
      error.value = ''
    }, 5000)
  }
}

// Helper function to try download
const tryDownload = (csvContent) => {
  try {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'template-import-alumni.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    return true
  } catch (err) {
    console.warn('Download template gagal, gunakan fallback:', err)
    return false
  }
}
// Helper function to show CSV in textarea
const showCsvTextarea = (csvContent) => {
  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `

  const modal = document.createElement('div')
  modal.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 800px;
    width: 100%;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
  `

  const title = document.createElement('h3')
  title.textContent = 'Copy Template CSV'
  title.style.cssText = 'margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1e293b;'

  const info = document.createElement('p')
  info.textContent =
    'Browser memblokir download. Silakan copy data di bawah, paste ke Excel, lalu save sebagai CSV:'
  info.style.cssText = 'margin: 0 0 12px 0; font-size: 14px; color: #64748b;'

  const textarea = document.createElement('textarea')
  textarea.readOnly = true
  textarea.value = csvContent
  textarea.style.cssText = `
    width: 100%;
    height: 300px;
    padding: 12px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    resize: vertical;
    margin-bottom: 16px;
  `

  const actions = document.createElement('div')
  actions.style.cssText = 'display: flex; gap: 12px; justify-content: flex-end;'

  const copyBtn = document.createElement('button')
  copyBtn.type = 'button'
  copyBtn.textContent = 'Copy ke Clipboard'
  copyBtn.style.cssText = `
    background: #4f46e5;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    font-size: 14px;
  `

  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.textContent = 'Tutup'
  closeBtn.style.cssText = `
    background: #e2e8f0;
    color: #475569;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    font-size: 14px;
  `

  actions.appendChild(copyBtn)
  actions.appendChild(closeBtn)
  modal.appendChild(title)
  modal.appendChild(info)
  modal.appendChild(textarea)
  modal.appendChild(actions)
  overlay.appendChild(modal)
  document.body.appendChild(overlay)

  textarea.focus()
  textarea.select()

  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(textarea.value)
    } catch (clipboardErr) {
      textarea.select()
      document.execCommand('copy')
    }
    message.value = 'CSV berhasil di-copy! Paste ke Excel.'
    setTimeout(() => {
      message.value = ''
    }, 4000)
    overlay.remove()
  }

  closeBtn.onclick = () => {
    overlay.remove()
  }

  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove()
  }
}


// Replaced synchronous buildSurveyLink with async API call
const getShareLinkApi = async (alumniItem) => {
  try {
    const response = await generateSurveyLink({
      nim: alumniItem.nim,
      expiry_days: 30,
      base_url: window.location.origin,
    })
    const url = response?.url || response?.data?.url
    if (!url) {
      throw new Error('URL token tidak tersedia.')
    }
    return url
  } catch (e) {
    console.error('Failed to generate link', e)
    throw new Error('Gagal membuat link survei')
  }
}

const buildShareMessage = (alumniItem, linkValue) => {
  const item = alumniItem || {}
  const template = (emailTemplate.value || defaultBlastTemplate).trim()
  const link = String(linkValue || '').trim()
  const logoUrl = String(blastLogoUrl.value || defaultBlastLogoUrl).trim()
  return template
    .replaceAll('{nama}', String(item.nama || 'Alumni'))
    .replaceAll('{nim}', String(item.nim || '-'))
    .replaceAll('{prodi}', String(item.prodi || '-'))
    .replaceAll('{fakultas}', String(item.fakultas || '-'))
    .replaceAll('{tahun_lulus}', String(item.tahunLulus || '-'))
    .replaceAll('{logo_url}', logoUrl)
    .replaceAll('{link}', link || `${window.location.origin}/kuisioner/alumni`)
}

const blastMessagePreview = computed(() => {
  const sample = selectedAlumniList.value[0] || {}
  const template = (templateDraft.value || emailTemplate.value || defaultBlastTemplate).trim()
  const logoUrl = String(logoUrlDraft.value || blastLogoUrl.value || defaultBlastLogoUrl).trim()
  return template
    .replaceAll('{nama}', String(sample.nama || 'Alumni'))
    .replaceAll('{nim}', String(sample.nim || '-'))
    .replaceAll('{prodi}', String(sample.prodi || '-'))
    .replaceAll('{fakultas}', String(sample.fakultas || '-'))
    .replaceAll('{tahun_lulus}', String(sample.tahunLulus || '-'))
    .replaceAll('{logo_url}', logoUrl)
    .replaceAll('{link}', `${window.location.origin}/kuisioner/login`)
})

const sendWhatsApp = async (alumniItem) => {
  try {
    message.value = 'Membuat link aman...'
    const link = await getShareLinkApi(alumniItem)
    const text = buildShareMessage(alumniItem, link)
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener')
    markSent(alumniItem.nim)
    message.value = ''
  } catch (e) {
    error.value = e.message
  }
}

const defaultBlastTemplate =
  'Yth. {nama},\n\nIni adalah email dari CDC UIN Kediri sebagai langkah untuk melakukan survey sebaran lulusan.\n\nBiodata alumni kami:\nNama: {nama}\nProgram studi: {prodi}\nTahun lulus: {tahun_lulus}\n\nMohon mengisi tracer study melalui tautan berikut:\n{link}\n\nTerima kasih.'
const emailTemplate = ref(defaultBlastTemplate)
const templateDraft = ref(defaultBlastTemplate)
const subjectDraft = ref(emailSubject.value)
const logoUrlDraft = ref(defaultBlastLogoUrl)

const loadEmailSettings = async () => {
  if (!hasApi) return
  try {
    const resp = await getEmailTemplate('alumni-blast')
    emailTemplate.value = resp?.body || defaultBlastTemplate
    emailSubject.value = resp?.subject || emailSubject.value
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || 'Gagal memuat narasi email.'
  }
}

const openEmailTemplateEditor = () => {
  templateDraft.value = emailTemplate.value || defaultBlastTemplate
  subjectDraft.value = emailSubject.value || 'Tracer Study Alumni - CDC UIN Kediri'
  logoUrlDraft.value = blastLogoUrl.value || defaultBlastLogoUrl
  emailTemplateOpen.value = true
}

const closeEmailTemplateEditor = () => {
  emailTemplateOpen.value = false
  confirmTemplateSaveOpen.value = false
}

const saveEmailTemplate = () => {
  const nextTemplate = templateDraft.value?.trim() || defaultBlastTemplate
  const nextSubject = subjectDraft.value?.trim() || 'Tracer Study Alumni - CDC UIN Kediri'
  const nextLogoUrl = logoUrlDraft.value?.trim() || defaultBlastLogoUrl
  if (!hasApi) {
    error.value = 'Backend tidak tersedia. Pastikan VITE_API_BASE_URL sudah diatur.'
    return
  }

  templateSaving.value = true
  error.value = ''
  updateEmailTemplate('alumni-blast', {
    subject: nextSubject,
    body: nextTemplate,
  })
    .then((resp) => {
      emailTemplate.value = resp?.body || nextTemplate
      emailSubject.value = resp?.subject || nextSubject
      blastLogoUrl.value = nextLogoUrl
      try {
        localStorage.setItem(BLAST_LOGO_STORAGE_KEY, nextLogoUrl)
      } catch (e) {
        // ignore storage errors
      }
      message.value = 'Narasi email tersimpan di backend.'
      emailTemplateOpen.value = false
    })
    .catch((e) => {
      error.value = e?.response?.data?.message || e?.message || 'Gagal menyimpan narasi email.'
    })
    .finally(() => {
      templateSaving.value = false
    })
}

const requestSaveEmailTemplate = () => {
  if (templateSaving.value) return
  if (!hasApi) {
    error.value = 'Backend tidak tersedia. Pastikan VITE_API_BASE_URL sudah diatur.'
    return
  }
  confirmTemplateSaveOpen.value = true
}

const closeTemplateSaveConfirm = () => {
  confirmTemplateSaveOpen.value = false
}

const confirmSaveEmailTemplate = () => {
  confirmTemplateSaveOpen.value = false
  saveEmailTemplate()
}

const resetEmailTemplate = () => {
  templateDraft.value = defaultBlastTemplate
  subjectDraft.value = 'Tracer Study Alumni - CDC UIN Kediri'
  logoUrlDraft.value = defaultBlastLogoUrl
}

const runEmailBlast = async (targets = []) => {
  if (!hasApi) {
    error.value = 'Backend tidak tersedia. Pastikan VITE_API_BASE_URL sudah diatur.'
    return
  }
  if (!targets.length) {
    error.value = 'Pilih minimal satu alumni.'
    return
  }

  blastLoading.value = true
  blastProgress.value = {
    status: 'starting',
    total: targets.length,
    processed: 0,
    sent: 0,
    failed: 0,
  }
  message.value = 'Menyiapkan pengiriman email...'
  error.value = ''
  try {
    const payload = {
      nims: targets.map((item) => item.nim),
      subject: emailSubject.value || 'Tracer Study Alumni',
      message: emailTemplate.value || defaultBlastTemplate,
      expiry_days: 30,
      base_url: window.location.origin,
    }
    const response = await blastEmail(payload)
    const blastId = response?.blast_id
    if (blastId) {
      blastProgress.value = {
        status: 'queued',
        total: targets.length,
        processed: 0,
        sent: 0,
        failed: 0,
      }
      message.value = 'Pengiriman email sedang diproses di background.'
      await pollBlastProgress(blastId, targets.length)
      return
    }

    throw new Error(
      'Backend belum mengembalikan blast_id. Pastikan backend production sudah pull commit terbaru, route cache dibersihkan, dan cdc-octane sudah direstart.',
    )
  } catch (e) {
    const detail = e?.response?.data?.message || e?.message || 'Gagal mengirim email.'
    error.value = detail
    message.value = ''
    if (blastProgress.value) {
      blastProgress.value = {
        ...blastProgress.value,
        status: 'failed',
      }
    }
  } finally {
    blastLoading.value = false
  }
}

const pollBlastProgress = async (blastId, totalTargets = 0) => {
  for (let attempt = 0; attempt < BLAST_PROGRESS_MAX_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, BLAST_PROGRESS_INTERVAL_MS))
    }

    const progress = await getBlastEmailProgress(blastId)
    const summary = progress?.summary || {}
    const sentList = progress?.sent || []
    const failedList = progress?.failed || []
    const processed = progress?.processed ?? ((summary.sent || 0) + (summary.failed || 0))
    const total = progress?.total || summary.total || totalTargets
    const status = progress?.status || 'processing'
    blastProgress.value = {
      status,
      total,
      processed,
      sent: summary.sent || sentList.length,
      failed: summary.failed || failedList.length,
    }

    if (sentList.length) {
      markSent(sentList.map((item) => item.nim))
    }

    message.value = 'Pengiriman email sedang diproses di background.'

    if (failedList.length) {
      const detail = failedList
        .slice(0, 3)
        .map((item) => `${item.nim || '-'}: ${item.reason || 'gagal'}`)
        .join('; ')
      error.value = `Sebagian email gagal. ${detail}${failedList.length > 3 ? '...' : ''}`
    }

    if (status === 'completed') {
      blastProgress.value = {
        status,
        total,
        processed: total,
        sent: summary.sent || sentList.length,
        failed: summary.failed || failedList.length,
      }
      message.value = `Email terkirim: ${summary.sent || sentList.length}, gagal: ${summary.failed || failedList.length}.`
      return
    }

    if (status === 'failed') {
      throw new Error(progress?.message || 'Pengiriman email gagal diproses di server.')
    }
  }

  throw new Error('Pengiriman email masih diproses. Cek kembali beberapa saat lagi atau pastikan queue worker aktif.')
}

const sendEmail = async (alumniItem) => {
  await runEmailBlast([alumniItem])
}

const sendBulkWhatsApp = async () => {
    if (!selectedAlumniList.value.length) {
        error.value = 'Pilih minimal satu alumni.'
        return
    }
    
    // For bulk, we need a generic link or individual links? 
    // Generic link is NOT supported by new security model (needs NIM in token).
    // So we can only send to ONE person effectively via Web Intent, OR we send them to a login page.
    
    // Pivot: Since we can't open 10 WhatsApp windows, Bulk Send via "Click to Chat" usually implies sending ONE message to ONE person, or a broadcast.
    // But broadcast needs a generic link.
    // Generic Link: /kuisioner/login (Alumni types their NIM).
    const genericLink = `${window.location.origin}/kuisioner/login`
    
    const first = selectedAlumniList.value[0] || {}
    const text = buildShareMessage(
      {
        ...first,
        nama:
          selectedAlumniList.value.length > 1
            ? `${first.nama || 'Alumni'} + ${selectedAlumniList.value.length - 1} alumni lain`
            : first.nama || 'Alumni',
      },
      genericLink,
    )
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener')
    markSent(selectedAlumniList.value.map(a => a.nim))
}

const sendBulkEmail = async () => {
  await runEmailBlast(selectedAlumniList.value)
}

const openSendLinkMenu = () => {
  sendLinkMenuOpen.value = true
}

const closeSendLinkMenu = () => {
  sendLinkMenuOpen.value = false
}

const chooseSendViaWhatsApp = async () => {
  closeSendLinkMenu()
  await sendBulkWhatsApp()
}

const chooseSendViaEmail = async () => {
  closeSendLinkMenu()
  await sendBulkEmail()
}

const goPrev = () => {
  if (currentPage.value > 1) currentPage.value -= 1
}

const goNext = () => {
  if (currentPage.value < totalPages.value) currentPage.value += 1
}

const showingRange = computed(() => {
  if (!paginatedAlumni.value.length) return { start: 0, end: 0, total: filteredAlumni.value.length }
  if (pageSize.value === 'all') {
    return { start: 1, end: filteredAlumni.value.length, total: filteredAlumni.value.length }
  }
  const size = Number(pageSize.value || 1)
  const start = (currentPage.value - 1) * size + 1
  const end = Math.min(filteredAlumni.value.length, start + size - 1)
  return { start, end, total: filteredAlumni.value.length }
})

// Duplicates removed

// buildSurveyLink removed
</script>

<template>
  <AdminShell>
    <div class="max-w-6xl px-4 py-6 sm:px-6 lg:px-10">
      <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Alumni</p>
          <h1 class="mt-1 text-2xl font-semibold text-slate-900">Daftar alumni terverifikasi</h1>
          <p class="mt-1 text-xs text-slate-500">
            Pantau data ringkas alumni: nama, NIM, program studi, fakultas, dan tahun lulus untuk kebutuhan tracer.
          </p>
          <p v-if="alumni.error" class="mt-2 text-xs font-semibold text-amber-600">
            {{ alumni.error }}
          </p>
        </div>
        <button
          type="button"
          class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 btn-white-gradient-hover"
          @click="goBack"
        >
          Kembali ke dashboard
        </button>
      </header>

      <section class="mb-6 grid gap-4 sm:grid-cols-3">
        <div class="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/70">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Total alumni</p>
          <p class="mt-2 text-3xl font-semibold text-slate-900">{{ totalAlumni }}</p>
          <p class="text-xs text-slate-500">{{ fakultasFilter === 'all' ? 'Semua fakultas' : fakultasFilter }}</p>
        </div>
        <div class="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/70">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Fakultas terwakili</p>
          <p class="mt-2 text-3xl font-semibold text-slate-900">{{ totalFakultas }}</p>
          <p class="text-xs text-slate-500">Dengan data alumni terkini</p>
        </div>
        <div class="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/70">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Sinkronisasi</p>
          <p class="mt-2 text-sm font-semibold text-slate-900">
            {{ alumni.loading ? 'Memuat data alumni...' : 'Data lokal/remote tersinkron' }}
          </p>
          <p class="text-xs text-slate-500">Siap untuk ekspor XLSX/CSV</p>
        </div>
      </section>

      <section class="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200/70">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Tabel daftar alumni</h2>
              <p class="text-sm text-slate-500">Menampilkan kolom Nama, NIM, Prodi, Fakultas, dan Tahun Lulus.</p>
            </div>
            <div class="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition btn-white-gradient-hover"
                :class="selectedAlumniList.length ? 'border-teal-200 bg-teal-50 text-teal-700' : ''"
                @click="openSendLinkMenu"
              >
                Kirim link ({{ selectedAlumniList.length || 0 }})
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition btn-white-gradient-hover"
                @click="openEmailTemplateEditor"
              >
                Edit narasi email
              </button>
              <button
                type="button"
                class="inline-flex shrink-0 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition btn-white-gradient-hover"
                @click="handleExport"
              >
                Ekspor CSV
              </button>
              <div class="inline-flex flex-nowrap items-center gap-2">
                <button
                  type="button"
                  class="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition btn-white-gradient-hover"
                  @click="handleImportClick"
                >
                  Import alumni
                </button>
                <button
                  type="button"
                  class="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-sky-200/60 transition hover:bg-sky-700"
                  @click="openSiakadSyncPlaceholder"
                >
                  Sync SIAKAD
                </button>
              </div>
            </div>
          </div>

          <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                v-model="search"
                type="search"
                placeholder="Cari nama, NIM, prodi..."
                class="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-inner shadow-slate-100 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 sm:w-64"
              />
              <select
                v-model="fakultasFilter"
                class="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner shadow-slate-100 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 sm:w-auto"
              >
                <option value="all">Semua fakultas</option>
                <option v-for="fak in fakultasOptions.slice(1)" :key="fak" :value="fak">{{ fak }}</option>
              </select>
              <select
                v-model="prodiFilter"
                class="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner shadow-slate-100 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 sm:w-auto"
              >
                <option value="all">Semua prodi</option>
                <option v-for="prodi in prodiOptions.slice(1)" :key="prodi" :value="prodi">{{ prodi }}</option>
              </select>
              <select
                v-model="tahunFilter"
                class="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner shadow-slate-100 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 sm:w-auto"
              >
                <option value="all">Semua tahun</option>
                <option v-for="tahun in tahunOptions.slice(1)" :key="tahun" :value="tahun">{{ tahun }}</option>
              </select>
            </div>
          </div>
          <div
            v-if="blastProgress"
            class="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 shadow-sm shadow-emerald-100/50"
          >
            <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p class="text-xs font-semibold text-emerald-700">
                {{ message || 'Pengiriman email sedang diproses.' }}
              </p>
              <p class="text-xs font-bold text-emerald-700">
                {{ blastProgress.processed }}/{{ blastProgress.total }} email - {{ blastProgressPercent }}%
              </p>
            </div>
            <div class="mt-2 h-3 overflow-hidden rounded-full bg-white ring-1 ring-emerald-100">
              <div
                class="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 transition-all duration-500 ease-out"
                :style="{ width: `${blastProgressPercent}%` }"
              ></div>
            </div>
            <div class="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold">
              <span class="rounded-full bg-white px-2.5 py-1 text-emerald-700 ring-1 ring-emerald-100">
                Terkirim: {{ blastProgress.sent }}
              </span>
              <span class="rounded-full bg-white px-2.5 py-1 text-rose-600 ring-1 ring-rose-100">
                Gagal: {{ blastProgress.failed }}
              </span>
              <span class="rounded-full bg-white px-2.5 py-1 text-slate-600 ring-1 ring-slate-100">
                Status: {{ blastProgress.status }}
              </span>
            </div>
          </div>
          <p v-else-if="message" class="mt-2 text-xs font-semibold text-emerald-600">{{ message }}</p>
          <p v-if="error" class="text-xs font-semibold text-rose-600">{{ error }}</p>

          <div class="mt-4 md:hidden">
            <div v-if="alumni.loading" class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Memuat data alumni...
            </div>
            <div v-else-if="!paginatedAlumni.length" class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Data tidak ditemukan.
            </div>
            <div
              v-else
              v-for="alumniItem in paginatedAlumni"
              :key="alumniItem.nim + '-card'"
              class="mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100"
            >
              <div class="flex items-start gap-3">
                <input
                  :checked="selectedIds.includes(alumniItem.nim)"
                  type="checkbox"
                  class="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  @change="toggleSelect(alumniItem.nim)"
                />
                <div class="flex-1 space-y-1 text-sm">
                  <p class="font-semibold text-slate-900">{{ alumniItem.nama }}</p>
                  <p class="font-mono text-xs text-slate-600">{{ alumniItem.nim }}</p>
                  <p class="text-xs text-slate-600">Prodi: {{ alumniItem.prodi }}</p>
                  <p class="text-xs text-slate-600">Fakultas: {{ alumniItem.fakultas }}</p>
                  <p class="text-xs text-slate-600">Tahun lulus: {{ alumniItem.tahunLulus }}</p>
                  <p class="text-xs font-semibold" :class="getStatusTextClass(alumniItem)">
                    Status: {{ getStatusLabel(alumniItem) }}
                  </p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                  class="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition btn-white-gradient-hover"
                  @click="sendWhatsApp(alumniItem)"
                >
                  <span aria-hidden="true">📱</span>
                  WA
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition btn-white-gradient-hover"
                  @click="sendEmail(alumniItem)"
                >
                  <span aria-hidden="true">✉️</span>
                  Email
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition btn-white-gradient-hover"
                  @click="startDetail(alumniItem)"
                >
                  <span aria-hidden="true">🔍</span>
                  Detail
                </button>
                <button
                  v-if="canEditAlumni"
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                  @click="openEdit(alumniItem)"
                >
                  Edit
                </button>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-100 hidden md:block">
            <table class="min-w-[900px] table-auto text-left text-sm text-slate-700">
              <thead class="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="px-4 py-2 font-semibold">
                    <div class="flex items-center gap-2">
                      <input
                        :checked="allSelected"
                        type="checkbox"
                        class="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        @change="toggleSelectAll"
                      />
                      <span>Nama</span>
                    </div>
                  </th>
                  <th class="px-4 py-2 font-semibold">NIM</th>
                  <th class="px-4 py-2 font-semibold">Prodi</th>
                  <th class="px-4 py-2 font-semibold">Fakultas</th>
                  <th class="px-4 py-2 font-semibold">Tahun lulus</th>
                  <th class="px-4 py-2 font-semibold">Aksi</th>
                  <th class="px-4 py-2 font-semibold">
                    <div class="flex items-center gap-2">
                      <span>Status</span>
                      <div class="flex overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                        <button
                          type="button"
                          class="flex h-7 w-7 items-center justify-center text-[11px] font-bold transition hover:bg-emerald-50 hover:text-emerald-700"
                          :class="statusFilter === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500'"
                          title="Filter sudah terkirim"
                          aria-label="Filter sudah terkirim"
                          @click="toggleStatusFilter('sent')"
                        >
                          &uarr;
                        </button>
                        <button
                          type="button"
                          class="flex h-7 w-7 items-center justify-center border-l border-slate-200 text-[11px] font-bold transition hover:bg-amber-50 hover:text-amber-700"
                          :class="statusFilter === 'unsent' ? 'bg-amber-100 text-amber-700' : 'text-slate-500'"
                          title="Filter belum terkirim"
                          aria-label="Filter belum terkirim"
                          @click="toggleStatusFilter('unsent')"
                        >
                          &darr;
                        </button>
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-if="alumni.loading">
                  <td colspan="7" class="px-4 py-5 text-center text-sm text-slate-500">Memuat data alumni...</td>
                </tr>
                <tr v-else-if="!paginatedAlumni.length">
                  <td colspan="7" class="px-4 py-6 text-center text-sm text-slate-500">Data tidak ditemukan.</td>
                </tr>
                <template v-else>
                  <tr v-for="alumniItem in paginatedAlumni" :key="alumniItem.nim" class="transition hover:bg-slate-50">
                    <td class="px-4 py-3 font-semibold text-slate-900">
                      <div class="flex items-center gap-3">
                        <input
                          :checked="selectedIds.includes(alumniItem.nim)"
                          type="checkbox"
                          class="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                          @change="toggleSelect(alumniItem.nim)"
                        />
                        <span>{{ alumniItem.nama }}</span>
                      </div>
                    </td>
                    <td class="px-4 py-3 font-mono text-sm text-slate-700">{{ alumniItem.nim }}</td>
                    <td class="px-4 py-3">{{ alumniItem.prodi }}</td>
                    <td class="px-4 py-3">
                      <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {{ alumniItem.fakultas }}
                      </span>
                    </td>
                    <td class="px-4 py-3">{{ alumniItem.tahunLulus }}</td>
                    <td class="px-4 py-3">
                      <div class="flex flex-wrap gap-2">
                        <button
                          type="button"
                          class="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition btn-white-gradient-hover"
                          @click="sendWhatsApp(alumniItem)"
                        >
                          <span aria-hidden="true">📱</span>
                          WA
                        </button>
                        <button
                          type="button"
                          class="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition btn-white-gradient-hover"
                          @click="sendEmail(alumniItem)"
                        >
                          <span aria-hidden="true">✉️</span>
                          Email
                        </button>
                        <button
                          type="button"
                          class="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition btn-white-gradient-hover"
                          @click="startDetail(alumniItem)"
                        >
                          <span aria-hidden="true">🔍</span>
                          Detail
                          </button>
                        <button
                          v-if="canEditAlumni"
                          type="button"
                          class="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                          @click="openEdit(alumniItem)"
                        >
                          Edit
                        </button>
                        </div>
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class="rounded-full px-3 py-1 text-xs font-semibold"
                        :class="getStatusClass(alumniItem)"
                      >
                        {{ getStatusLabel(alumniItem) }}
                      </span>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <div class="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
            <div class="flex items-center gap-2">
              <span>Halaman {{ currentPage }} dari {{ totalPages }}</span>
              <span class="text-slate-500">| Menampilkan {{ showingRange.start }}-{{ showingRange.end }} dari {{ showingRange.total }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <label class="flex items-center gap-2 text-xs font-semibold text-slate-700">
                Tampilkan
                <select
                  v-model="pageSize"
                  class="rounded-xl border border-slate-200 px-3 py-1 text-xs text-slate-700 shadow-inner shadow-slate-100 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
                >
                  <option v-for="size in pageSizeOptions" :key="size" :value="size">
                    {{ size === 'all' ? 'Semua' : size }}
                  </option>
                </select>
                data
              </label>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition btn-white-gradient-hover"
                  :disabled="currentPage === 1"
                  @click="goPrev"
                >
                  Prev
                </button>
                <button
                  type="button"
                  class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition btn-white-gradient-hover"
                  :disabled="currentPage === totalPages"
                  @click="goNext"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
          <input
            ref="importInput"
            type="file"
            accept=".csv,.txt,.xlsx"
            class="hidden"
            @change="onImportFileSelected"
          />
          <p v-if="importLoading" class="mt-2 text-xs font-semibold text-slate-500">Mengimpor data...</p>
      </section>
    </div>

    <div
      v-if="importModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-5 shadow-xl shadow-slate-900/15">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">Impor dari SIAKAD</p>
            <h3 class="text-lg font-semibold text-slate-900">Sinkronisasi data lulusan</h3>
            <p class="text-xs text-slate-500">API resmi belum tersedia; tombol di bawah menjalankan simulasi import.</p>
          </div>
          <button
            type="button"
            class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            @click="closeImportModal"
          >
            Tutup
          </button>
        </div>

        <div class="mt-3 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-xs text-slate-700">
          <p>Ketika API siap, alur ini akan memanggil endpoint SIAKAD untuk menarik data lulusan terbaru.</p>
          <p>Untuk sekarang, gunakan simulasi atau unggah CSV/XLSX manual agar tabel tetap terisi.</p>
          <details class="space-y-2 rounded-2xl bg-white/60 p-3 text-xs">
            <summary class="cursor-pointer font-semibold text-slate-800">Lihat format CSV & contoh data</summary>
            <p class="font-semibold text-slate-800">Format CSV (baris pertama wajib header):</p>
            <code class="block rounded-lg bg-slate-900/90 px-3 py-2 font-mono text-[11px] text-emerald-100">
              Nama,NIM,Prodi,Fakultas,Tahun Lulus,Tahun Masuk,Email,NIK,No HP,Alamat,Tanggal Lahir,Foto
            </code>
            <p class="font-semibold text-slate-800">Contoh isi:</p>
            <pre class="overflow-x-auto rounded-lg bg-slate-900/90 px-3 py-2 font-mono text-[11px] text-indigo-100">
Nama,NIM,Prodi,Fakultas,Tahun Lulus,Tahun Masuk,Email,NIK,No HP,Alamat,Tanggal Lahir,Foto
Siti Aisyah,190102001,Informatika,Teknik,2023,2019,siti.aisyah@example.com,320190100001,0812102001,"Alamat alumni 1",1999-01-10,
Rizky Pratama,190102014,Sistem Informasi,Teknik,2022,2018,rizky.pratama@example.com,320190100014,0812102014,"Jl. Kenari No. 8, Jakarta",1998-11-05,
Mega Lestari,190103019,Teknik Sipil,Teknik,2020,2016,mega.lestari@example.com,320190100019,0812102019,"Jl. Gatot Subroto No. 88, Bandung",1996-12-11,https://example.com/foto.jpg</pre>
            <p class="text-[11px] text-slate-600">Minimal 11 kolom terisi (kolom Foto opsional). Gunakan koma sebagai pemisah dan satu baris per alumni.</p>
          </details>
        </div>

        <div class="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
            :disabled="importLoading"
            @click="openSiakadWarning"
          >
            {{ importLoading ? 'Memproses...' : 'Import Lulusan SIAKAD' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition btn-white-gradient-hover"
            :disabled="importLoading"
            @click="openManualImport"
          >
            Pilih file CSV/XLSX
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="importLoading || !selectedImportFile"
            @click="startImportUpload"
          >
            {{ importLoading ? 'Uploading...' : 'Upload ke sistem' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition btn-white-gradient-hover"
            :disabled="importLoading"
            @click="downloadTemplateCsv"
          >
            Unduh template
          </button>
        </div>

        <div class="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <label class="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Mode import
          </label>
          <select
            v-model="importMode"
            :disabled="importLoading"
            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          >
            <option value="smart">Smart (otomatis perbaiki format umum)</option>
            <option value="strict">Strict (validasi ketat, gagal jika format salah)</option>
          </select>
        </div>

        <p v-if="selectedImportFileName" class="mt-2 text-xs font-semibold text-slate-600">
          File terpilih: {{ selectedImportFileName }}
          <span v-if="selectedImportFileRows > 0">({{ selectedImportFileRows }} baris)</span>
        </p>

        <div v-if="importPreviewLoading" class="mt-2 text-xs text-slate-500">Memvalidasi format file...</div>
        <div v-else-if="importPreview" class="mt-2 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700">
          <p class="font-semibold text-slate-900">Preview validasi:</p>
          <p>Format file: {{ String(importPreview.format || '-').toUpperCase() }}</p>
          <p v-if="importPreview.format === 'csv'">Pemisah terdeteksi: {{ importPreview.delimiter || ',' }}</p>
          <p v-if="importPreview.encoding">Encoding: {{ importPreview.encoding }}</p>
          <p>Total baris data: {{ importPreview.total_rows || 0 }}</p>
          <p>Baris valid: {{ importPreview.valid_rows || 0 }}</p>
          <p>Baris perlu perhatian: {{ importPreview.invalid_rows || 0 }}</p>
          <p v-if="(importPreview.missing_required_headers || []).length" class="font-semibold text-rose-600">
            Header wajib belum lengkap: {{ (importPreview.missing_required_headers || []).join(', ') }}
          </p>
          <p
            v-if="(importPreview.errors || []).length"
            class="mt-1 text-[11px] text-amber-700"
          >
            Catatan validasi tersedia pada {{ Math.min((importPreview.errors || []).length, 200) }} baris pertama bermasalah.
          </p>
        </div>

        <div v-if="importLoading || importProgress > 0" class="mt-4">
          <div class="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-600">
            <span>{{ importProgressLabel || 'Memproses import...' }}</span>
            <span>{{ Math.round(importProgress) }}%</span>
          </div>
          <div class="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              class="h-full rounded-full bg-emerald-500 transition-all duration-300"
              :style="{ width: `${Math.max(2, importProgress)}%` }"
            ></div>
          </div>
        </div>

        <p v-if="importStatus" class="mt-3 text-xs font-semibold text-slate-600">{{ importStatus }}</p>
        <div v-if="importReview" class="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900">
          <p class="font-semibold">Review hasil upload:</p>
          <p>Total data: {{ importReview.total }}</p>
          <p>Diproses: {{ importReview.processed }}</p>
          <p>Berhasil: {{ importReview.success }}</p>
          <p>Gagal: {{ importReview.failed }}</p>
          <p v-if="normalizedEmailCount > 0">Email diperbaiki otomatis: {{ normalizedEmailCount }}</p>
          <a
            v-if="importFailedReportUrl && importReview.failed > 0"
            :href="importFailedReportUrl"
            target="_blank"
            rel="noopener"
            class="mt-2 inline-flex items-center justify-center rounded-full border border-emerald-300 bg-white px-3 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            Unduh daftar gagal
          </a>
          <p v-if="importReview.estimated" class="mt-1 text-[11px] text-emerald-700">
            Ringkasan ditampilkan berdasarkan sinkronisasi data terakhir. Silakan klik tombol di bawah untuk memuat tampilan terbaru.
          </p>
          <button
            type="button"
            class="mt-3 inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            @click="confirmImportReview"
          >
            OK & Reload Halaman
          </button>
        </div>
        <p v-if="message" class="text-xs font-semibold text-emerald-600">{{ message }}</p>
        <p v-if="error" class="text-xs font-semibold text-rose-600">{{ error }}</p>
      </div>
    </div>

    <div
      v-if="emailTemplateOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-3 py-3 sm:px-4 sm:py-6"
      role="dialog"
      aria-modal="true"
    >
      <div class="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/15">
        <div class="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Narasi pengiriman</p>
            <h3 class="text-lg font-semibold text-slate-900">Atur narasi blast email & WhatsApp</h3>
            <p class="text-xs text-slate-500">
              Gunakan placeholder: {nama}, {nim}, {prodi}, {fakultas}, {tahun_lulus}, {logo_url}, {link}.
            </p>
          </div>
          <button
            type="button"
            class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            @click="closeEmailTemplateEditor"
          >
            Tutup
          </button>
        </div>

        <div class="space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
          <label class="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Subjek email
          </label>
          <input
            v-model="subjectDraft"
            type="text"
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 shadow-inner shadow-slate-100 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
            placeholder="Contoh: Undangan pengisian tracer study"
          />

          <label class="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            URL logo
          </label>
          <input
            v-model="logoUrlDraft"
            type="text"
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 shadow-inner shadow-slate-100 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
            placeholder="https://domain-kampus/logo-cdc.png"
          />

          <label class="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Narasi blast terpadu
          </label>
          <textarea
            v-model="templateDraft"
            rows="7"
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-inner shadow-slate-100 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
            placeholder="Tulis narasi yang dipakai untuk blast email dan WhatsApp..."
          ></textarea>
          <div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-600">
            Contoh: Halo {nama}, mohon isi tracer study di tautan berikut: {link}
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Preview pesan WhatsApp</p>
            <pre class="mt-2 whitespace-pre-wrap break-words text-xs text-slate-700">{{ blastMessagePreview }}</pre>
          </div>
        </div>

        <div class="flex flex-wrap gap-3 border-t border-slate-100 px-5 py-4 sm:px-6">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
            :disabled="templateSaving"
            @click="requestSaveEmailTemplate"
          >
            {{ templateSaving ? 'Menyimpan...' : 'Simpan narasi' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition btn-white-gradient-hover"
            @click="resetEmailTemplate"
          >
            Kembalikan default
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="sendLinkMenuOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/15">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Kirim Link Alumni</p>
            <h3 class="text-lg font-semibold text-slate-900">Pilih channel pengiriman</h3>
            <p class="mt-1 text-xs text-slate-500">
              Target terpilih: {{ selectedAlumniList.length }} alumni.
            </p>
          </div>
          <button
            type="button"
            class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            @click="closeSendLinkMenu"
          >
            Tutup
          </button>
        </div>

        <div class="mt-5 grid gap-3">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            @click="chooseSendViaWhatsApp"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M12 2a10 10 0 0 0-8.77 14.8L2 22l5.37-1.2A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.08-1.12l-.29-.17-3.18.71.7-3.1-.2-.31A8 8 0 1 1 12 20Zm4.44-5.62c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12s-.62.78-.77.94c-.14.16-.28.18-.52.06a6.5 6.5 0 0 1-1.92-1.18 7.2 7.2 0 0 1-1.33-1.66c-.14-.24-.02-.37.1-.5.1-.1.24-.26.36-.38.12-.12.16-.2.24-.34.08-.14.04-.26-.02-.38-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.42-.54-.43h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.3.98 2.46c.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.5.58.18 1.1.16 1.52.1.46-.06 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z"/>
            </svg>
            Kirim via WhatsApp
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
            @click="chooseSendViaEmail"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm9 7.2L4 7v10h16V7l-8 5.2Zm0-2L19.6 6H4.4L12 10.2Z"/>
            </svg>
            Kirim via Email
          </button>
        </div>

        <p class="mt-4 text-[11px] text-slate-500">
          Untuk blast email, admin wajib memilih target alumni terlebih dahulu.
        </p>
      </div>
    </div>
    <Transition name="alert-dialog">
      <div
        v-if="confirmTemplateSaveOpen"
        class="alert-dialog-backdrop fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4 py-6"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="template-confirm-title"
        aria-describedby="template-confirm-desc"
        @click.self="closeTemplateSaveConfirm"
      >
        <div class="alert-dialog-panel w-full max-w-md rounded-2xl bg-white p-6 shadow-xl shadow-slate-900/20">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600">Konfirmasi</p>
              <h3 id="template-confirm-title" class="text-lg font-semibold text-slate-900">
                Simpan narasi pengiriman?
              </h3>
              <p id="template-confirm-desc" class="mt-2 text-sm text-slate-600">
                Perubahan narasi email dan share link akan disimpan.
              </p>
            </div>
            <button
              type="button"
              class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              @click="closeTemplateSaveConfirm"
            >
              Tutup
            </button>
          </div>
          <div class="mt-5 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              @click="closeTemplateSaveConfirm"
            >
              Batal
            </button>
            <button
              type="button"
              class="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
              :disabled="templateSaving"
              @click="confirmSaveEmailTemplate"
            >
              {{ templateSaving ? 'Menyimpan...' : 'Ya, simpan' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
    <div
      v-if="showDetailModal && selectedAlumni"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/20">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <img
              :src="selectedAlumni.foto || defaultAvatar"
              alt="Foto alumni"
              class="h-14 w-14 rounded-2xl object-cover shadow"
            />
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Detail alumni</p>
              <h3 class="text-lg font-semibold text-slate-900">{{ selectedAlumni.nama }}</h3>
              <p class="text-xs text-slate-500">{{ selectedAlumni.nim }}</p>
            </div>
          </div>
          <button
            type="button"
            class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            @click="closeDetail"
          >
            Tutup
          </button>
        </div>
        <dl class="mt-4 space-y-3 text-sm text-slate-700">
          <div class="flex justify-between">
            <dt class="text-slate-500">Prodi</dt>
            <dd class="font-semibold text-slate-900">{{ selectedAlumni.prodi }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">Email</dt>
            <dd class="font-semibold text-slate-900">{{ selectedAlumni.email || '-' }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">NIK</dt>
            <dd class="font-semibold text-slate-900">{{ selectedAlumni.nik || '-' }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">No HP</dt>
            <dd class="font-semibold text-slate-900">{{ selectedAlumni.noHp || '-' }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">Alamat</dt>
            <dd class="flex-1 text-right font-semibold text-slate-900">{{ selectedAlumni.alamat || '-' }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">Fakultas</dt>
            <dd class="font-semibold text-slate-900">{{ selectedAlumni.fakultas }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">Tahun Masuk</dt>
            <dd class="font-semibold text-slate-900">{{ selectedAlumni.tahunMasuk || '-' }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">Tahun Lulus</dt>
            <dd class="font-semibold text-slate-900">{{ selectedAlumni.tahunLulus }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">Tanggal lahir</dt>
            <dd class="font-semibold text-slate-900">{{ selectedAlumni.dob || '-' }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">Terakhir diperbarui</dt>
            <dd class="font-semibold text-slate-900">
              {{
                new Date(selectedAlumni.updatedAt).toLocaleString('id-ID', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              }}
            </dd>
          </div>
        </dl>
        <div v-if="canEditAlumni" class="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
            @click="openEdit(selectedAlumni)"
          >
            Edit data
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition btn-white-gradient-hover disabled:opacity-60"
            :disabled="syncLoading || !canSyncAlumni(selectedAlumni)"
            @click="syncAlumni(selectedAlumni)"
          >
            {{ syncLoading ? 'Menyimpan...' : 'Sinkronkan ke DB' }}
          </button>
        </div>
      </div>
    </div>
    <div
      v-if="editModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/20">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">Edit alumni</p>
            <h3 class="text-lg font-semibold text-slate-900">Perbarui data alumni</h3>
            <p class="text-xs text-slate-500">Pastikan data yang diubah sudah sesuai dengan dokumen alumni.</p>
          </div>
          <button
            type="button"
            class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            @click="closeEdit"
          >
            Tutup
          </button>
        </div>

        <form class="mt-4 grid gap-4 sm:grid-cols-2" @submit.prevent="requestSaveEdit">
          <div class="space-y-1">
            <label class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Nama</label>
            <input
              v-model="editDraft.nama"
              type="text"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 shadow-inner shadow-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="Nama lengkap"
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">NIM</label>
            <input
              v-model="editDraft.nim"
              type="text"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 shadow-inner shadow-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="NIM"
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Email</label>
            <input
              v-model="editDraft.email"
              type="email"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 shadow-inner shadow-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="Email aktif"
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">NIK</label>
            <input
              v-model="editDraft.nik"
              type="text"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 shadow-inner shadow-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="Nomor induk kependudukan"
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">No HP</label>
            <input
              v-model="editDraft.noHp"
              type="text"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 shadow-inner shadow-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="Nomor HP"
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Prodi</label>
            <input
              v-model="editDraft.prodi"
              type="text"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 shadow-inner shadow-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="Program studi"
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Fakultas</label>
            <input
              v-model="editDraft.fakultas"
              type="text"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 shadow-inner shadow-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="Fakultas"
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tahun Masuk</label>
            <input
              v-model="editDraft.tahunMasuk"
              type="number"
              min="1900"
              max="2100"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 shadow-inner shadow-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="2019"
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tahun Lulus</label>
            <input
              v-model="editDraft.tahunLulus"
              type="number"
              min="1900"
              max="2100"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 shadow-inner shadow-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="2023"
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tanggal lahir</label>
            <input
              v-model="editDraft.dob"
              type="date"
              lang="id-ID"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 shadow-inner shadow-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div class="space-y-1 sm:col-span-2">
            <label class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Alamat</label>
            <textarea
              v-model="editDraft.alamat"
              rows="2"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 shadow-inner shadow-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="Alamat lengkap"
            ></textarea>
          </div>
          <div class="space-y-1 sm:col-span-2">
            <label class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Foto (URL)</label>
            <input
              v-model="editDraft.foto"
              type="text"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 shadow-inner shadow-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="https://..."
            />
          </div>
        </form>

        <p v-if="editError" class="mt-3 text-xs font-semibold text-rose-600">{{ editError }}</p>

        <div class="mt-5 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition btn-white-gradient-hover"
            @click="closeEdit"
          >
            Batal
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
            :disabled="editSaving"
            @click="requestSaveEdit"
          >
            {{ editSaving ? 'Menyimpan...' : 'Simpan perubahan' }}
          </button>
        </div>
      </div>
    </div>
    <Transition name="alert-dialog">
      <div
        v-if="confirmSaveOpen"
        class="alert-dialog-backdrop fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4 py-6"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="edit-confirm-title"
        aria-describedby="edit-confirm-desc"
        @click.self="closeSaveConfirm"
      >
        <div class="alert-dialog-panel w-full max-w-md rounded-2xl bg-white p-6 shadow-xl shadow-slate-900/20">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600">Konfirmasi</p>
              <h3 id="edit-confirm-title" class="text-lg font-semibold text-slate-900">
                Simpan perubahan data alumni?
              </h3>
              <p id="edit-confirm-desc" class="mt-2 text-sm text-slate-600">
                Perubahan untuk
                <span class="font-semibold text-slate-900">{{ editDraft.nama || 'alumni' }}</span>
                akan disimpan ke sistem.
              </p>
            </div>
            <button
              type="button"
              class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              @click="closeSaveConfirm"
            >
              Tutup
            </button>
          </div>
          <div class="mt-5 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              @click="closeSaveConfirm"
            >
              Batal
            </button>
            <button
              type="button"
              class="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
              :disabled="editSaving"
              @click="confirmSaveEdit"
            >
              {{ editSaving ? 'Menyimpan...' : 'Ya, simpan' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
    <div
      v-if="showSiakadWarning"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/20">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600">Pemberitahuan</p>
            <h3 class="text-lg font-semibold text-slate-900">Fitur dalam pengembangan</h3>
            <p class="mt-2 text-sm text-slate-600">
              Sinkronisasi data lulusan dari SIAKAD masih dalam proses development. Data target sinkron mengikuti
              halaman Detail Alumni (nama, NIM, prodi, fakultas, tahun masuk/lulus, email, NIK, no HP, alamat, tanggal
              lahir, foto). Silakan gunakan import CSV manual untuk sementara waktu.
            </p>
          </div>
          <button
            type="button"
            class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            @click="closeSiakadWarning"
          >
            Tutup
          </button>
        </div>
        <div class="mt-5 flex justify-end">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition btn-white-gradient-hover"
            @click="closeSiakadWarning"
          >
            Saya mengerti
          </button>
        </div>
      </div>
    </div>
  </AdminShell>
  <LoadingOverlay :active="pageLoading" />
</template>

