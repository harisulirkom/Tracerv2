<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAlumni } from '../stores/alumni'
import AdminShell from '../components/AdminShell.vue'

const router = useRouter()
const { alumni, fetchAlumni, addAlumni, exportAlumniCsv, markSent } = useAlumni()
const defaultAvatar = 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=240&q=60'

const search = ref('')
const fakultasFilter = ref('all')
const prodiFilter = ref('all')
const tahunFilter = ref('all')
const selectedAlumni = ref(null)
const selectedIds = ref([])
const message = ref('')
const error = ref('')
const importLoading = ref(false)
const importStatus = ref('')
const importModalOpen = ref(false)
const importInput = ref(null)
const showDetailModal = ref(false)
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 hari
const pageSizeOptions = ['all', 10, 50, 100, 200]
const pageSize = ref(10)
const currentPage = ref(1)
const bulkMenuOpen = ref(false)

const goBack = () => {
  router.push('/admin')
}

const setSelection = (item) => {
  selectedAlumni.value = item
}

onMounted(async () => {
  await fetchAlumni()
})

const fakultasOptions = computed(() => [
  'all',
  ...new Set(alumni.value.items.map((item) => item.fakultas).filter(Boolean)),
])

const prodiOptions = computed(() => [
  'all',
  ...new Set(alumni.value.items.map((item) => item.prodi).filter(Boolean)),
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
    return matchTerm && matchFakultas && matchProdi && matchTahun
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

watch(currentPage, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
  if (currentPage.value < 1) {
    currentPage.value = 1
  }
})

const totalAlumni = computed(() => filteredAlumni.value.length)
const totalFakultas = computed(() => new Set(filteredAlumni.value.map((item) => item.fakultas)).size)
const allSelected = computed(
  () => paginatedAlumni.value.length > 0 && paginatedAlumni.value.every((item) => selectedIds.value.includes(item.nim)),
)
const selectedAlumniList = computed(() =>
  alumni.value.items.filter((item) => selectedIds.value.includes(item.nim)),
)

const startDetail = (item) => {
  setSelection(item)
  showDetailModal.value = true
  message.value = ''
  error.value = ''
}

const closeDetail = () => {
  showDetailModal.value = false
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
  importModalOpen.value = true
}

const handleImportFile = async (event) => {
  const file = event.target?.files?.[0]
  if (!file) return
  importLoading.value = true
  message.value = ''
  error.value = ''
  try {
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((line) => line.trim())
    if (!lines.length) {
      throw new Error('File import kosong.')
    }

    const rows = lines.slice(1) // lewati header
    let imported = 0
    rows.forEach((line) => {
      const cols = line
        .split(',')
        .map((col) => col.replace(/^"|"$/g, '').replace(/""/g, '"').trim())
      if (cols.length >= 10) {
        const [
          nama,
          nim,
          prodi,
          fakultas,
          tahunLulus,
          tahunMasuk,
          nik,
          noHp,
          alamat,
          dob,
          foto,
        ] = cols
        addAlumni({ nama, nim, prodi, fakultas, tahunLulus, tahunMasuk, nik, noHp, alamat, dob, foto })
        imported += 1
      }
    })

    if (!imported) {
      throw new Error('Tidak ada baris valid pada file import. Pastikan minimal 10 kolom diisi.')
    }

    message.value = `${imported} data alumni berhasil diimport.`
    error.value = ''
  } catch (e) {
    error.value = e?.message || 'Gagal mengimport data alumni.'
    message.value = ''
  } finally {
    importLoading.value = false
    if (importInput.value) {
      importInput.value.value = ''
    }
  }
}

const openManualImport = () => {
  importStatus.value = ''
  error.value = ''
  message.value = ''
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
}

const downloadTemplateCsv = () => {
  const header = [
    'Nama',
    'NIM',
    'Prodi',
    'Fakultas',
    'Tahun Lulus',
    'Tahun Masuk',
    'NIK',
    'No HP',
    'Alamat',
    'Tanggal Lahir',
    'Foto',
  ]
  const sampleRows = [
    [
      'Siti Aisyah',
      '190102001',
      'Informatika',
      'Teknik',
      '2023',
      '2019',
      '320190100001',
      '0812102001',
      'Alamat alumni 1',
      '1999-01-10',
      '',
    ],
    [
      'Rizky Pratama',
      '190102014',
      'Sistem Informasi',
      'Teknik',
      '2022',
      '2018',
      '320190100014',
      '0812102014',
      'Jl. Kenari No. 8, Jakarta',
      '1998-11-05',
      '',
    ],
    [
      'Mega Lestari',
      '190103019',
      'Teknik Sipil',
      'Teknik',
      '2020',
      '2016',
      '320190100019',
      '0812102019',
      'Jl. Gatot Subroto No. 88, Bandung',
      '1996-12-11',
      'https://example.com/foto.jpg',
    ],
  ]
  const csv = [header.join(',')]
    .concat(sampleRows.map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',')))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'template-import-alumni.csv')
  link.click()
  URL.revokeObjectURL(url)
}

const getShareLink = (alumniItem = null, channel = 'email') => {
  if (alumniItem) return buildSurveyLink(alumniItem, channel)
  return `${window.location.origin}/kuisioner/alumni`
}

const sendWhatsApp = (alumniItem) => {
  const link = buildSurveyLink(alumniItem, 'wa')
  const text = `Halo ${alumniItem.nama}, mohon mengisi tracer study melalui tautan berikut (aktif 1 bulan): ${link}`
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(url, '_blank', 'noopener')
  markSent(alumniItem.nim)
}

const sendEmail = (alumniItem) => {
  const subject = 'Tracer Study Alumni'
  const link = buildSurveyLink(alumniItem, 'email')
  const body = `Halo ${alumniItem.nama},%0A%0AMohon mengisi tracer study melalui tautan berikut (aktif 1 bulan sejak dikirim): ${link}%0A%0ATerima kasih.`
  const mailto = `mailto:${alumniItem.email || ''}?subject=${subject}&body=${body}`
  window.location.href = mailto
  markSent(alumniItem.nim)
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

const sendBulkWhatsApp = () => {
  if (!selectedAlumniList.value.length) {
    error.value = 'Pilih minimal satu alumni terlebih dahulu.'
    return
  }
  error.value = ''
  const names = selectedAlumniList.value.slice(0, 3).map((a) => a.nama).join(', ')
  const more = selectedAlumniList.value.length > 3 ? `, dan ${selectedAlumniList.value.length - 3} lainnya` : ''
  const text = `Halo ${names}${more}, mohon mengisi tracer study melalui tautan berikut: ${getShareLink()}`
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(url, '_blank', 'noopener')
  message.value = `Tautan dibuka di WhatsApp untuk ${selectedAlumniList.value.length} alumni.`
  bulkMenuOpen.value = false
  markSent(selectedAlumniList.value.map((a) => a.nim))
}

const sendBulkEmail = () => {
  if (!selectedAlumniList.value.length) {
    error.value = 'Pilih minimal satu alumni terlebih dahulu.'
    return
  }
  error.value = ''
  const names = selectedAlumniList.value.slice(0, 3).map((a) => a.nama).join(', ')
  const more = selectedAlumniList.value.length > 3 ? `, dan ${selectedAlumniList.value.length - 3} lainnya` : ''
  const subject = 'Tracer Study Alumni'
  const body = `Halo ${names}${more},%0A%0AMohon mengisi tracer study melalui tautan berikut: ${getShareLink()}%0A%0ATerima kasih.`
  const mailto = `mailto:?subject=${subject}&body=${body}`
  window.location.href = mailto
  message.value = `Tautan dibuka di email untuk ${selectedAlumniList.value.length} alumni.`
  bulkMenuOpen.value = false
  markSent(selectedAlumniList.value.map((a) => a.nim))
}

const buildSurveyLink = (alumniItem, channel = 'email') => {
  const payload = {
    nim: alumniItem?.nim,
    exp: Date.now() + TOKEN_TTL_MS,
    channel,
  }
  const token = btoa(JSON.stringify(payload))
  return `${window.location.origin}/kuisioner/alumni?token=${encodeURIComponent(token)}`
}
</script>

<template>
  <AdminShell>
    <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10">
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
            <div class="flex flex-wrap items-center gap-2">
              <div class="relative">
                <button
                  type="button"
                class="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition btn-white-gradient-hover"
                :class="selectedAlumniList.length ? 'border-teal-200 bg-teal-50 text-teal-700' : ''"
                @click="bulkMenuOpen = !bulkMenuOpen"
              >
                Kirim link ({{ selectedAlumniList.length || 0 }})
                  <span aria-hidden="true">▾</span>
                </button>
                <div
                  v-if="bulkMenuOpen"
                  class="absolute right-0 z-10 mt-2 w-48 rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/80"
                >
                  <button
                    type="button"
                  class="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-semibold text-slate-700 transition btn-white-gradient-hover"
                  @click="sendBulkWhatsApp"
                >
                  <span aria-hidden="true">📱</span>
                  Kirim via WhatsApp
                </button>
                <button
                  type="button"
                  class="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-semibold text-slate-700 transition btn-white-gradient-hover"
                  @click="sendBulkEmail"
                >
                  <span aria-hidden="true">✉️</span>
                  Kirim via Email
                </button>
                </div>
              </div>
              <button
                type="button"
                class="hidden rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition btn-white-gradient-hover md:inline-flex"
                @click="handleExport"
              >
                Ekspor CSV
              </button>
              <button
                type="button"
                class="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition btn-white-gradient-hover"
                @click="handleImportClick"
              >
                Import alumni
              </button>
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
              <button
                type="button"
                class="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition btn-white-gradient-hover md:hidden"
                @click="handleExport"
              >
                Ekspor CSV
              </button>
          </div>
          <p v-if="message" class="mt-2 text-xs font-semibold text-emerald-600">{{ message }}</p>
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
                  <p class="text-xs font-semibold" :class="alumniItem.sent ? 'text-emerald-600' : 'text-amber-600'">
                    Status: {{ alumniItem.sent ? 'Sudah terkirim' : 'Belum terkirim' }}
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
                  <th class="px-4 py-2 font-semibold">Status</th>
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
                        </div>
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class="rounded-full px-3 py-1 text-xs font-semibold"
                        :class="alumniItem.sent ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'"
                      >
                        {{ alumniItem.sent ? 'Sudah terkirim' : 'Belum terkirim' }}
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
            accept=".csv,.txt"
            class="hidden"
            @change="handleImportFile"
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
      <div class="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/15">
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

        <div class="mt-4 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-700">
          <p>Ketika API siap, alur ini akan memanggil endpoint SIAKAD untuk menarik data lulusan terbaru.</p>
          <p>Untuk sekarang, gunakan simulasi atau unggah CSV manual agar tabel tetap terisi.</p>
          <div class="space-y-2 rounded-2xl bg-white/60 p-3 text-xs">
            <p class="font-semibold text-slate-800">Format CSV (baris pertama wajib header):</p>
            <code class="block rounded-lg bg-slate-900/90 px-3 py-2 font-mono text-[11px] text-emerald-100">
              Nama,NIM,Prodi,Fakultas,Tahun Lulus,Tahun Masuk,NIK,No HP,Alamat,Tanggal Lahir,Foto
            </code>
            <p class="font-semibold text-slate-800">Contoh isi:</p>
            <pre class="overflow-x-auto rounded-lg bg-slate-900/90 px-3 py-2 font-mono text-[11px] text-indigo-100">
Nama,NIM,Prodi,Fakultas,Tahun Lulus,Tahun Masuk,NIK,No HP,Alamat,Tanggal Lahir,Foto
Siti Aisyah,190102001,Informatika,Teknik,2023,2019,320190100001,0812102001,"Alamat alumni 1",1999-01-10,
Rizky Pratama,190102014,Sistem Informasi,Teknik,2022,2018,320190100014,0812102014,"Jl. Kenari No. 8, Jakarta",1998-11-05,
Mega Lestari,190103019,Teknik Sipil,Teknik,2020,2016,320190100019,0812102019,"Jl. Gatot Subroto No. 88, Bandung",1996-12-11,https://example.com/foto.jpg</pre>
            <p class="text-[11px] text-slate-600">Minimal 10 kolom terisi (kolom Foto opsional). Gunakan koma sebagai pemisah dan satu baris per alumni.</p>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
            :disabled="importLoading"
            @click="importFromSiakad"
          >
            {{ importLoading ? 'Memproses...' : 'Simulasikan impor SIAKAD' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition btn-white-gradient-hover"
            :disabled="importLoading"
            @click="openManualImport"
          >
            Impor CSV manual
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition btn-white-gradient-hover"
            :disabled="importLoading"
            @click="downloadTemplateCsv"
          >
            Unduh template CSV
          </button>
        </div>

        <p v-if="importStatus" class="mt-3 text-xs font-semibold text-slate-600">{{ importStatus }}</p>
        <p v-if="message" class="text-xs font-semibold text-emerald-600">{{ message }}</p>
        <p v-if="error" class="text-xs font-semibold text-rose-600">{{ error }}</p>
      </div>
    </div>

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
      </div>
    </div>
  </AdminShell>
</template>
