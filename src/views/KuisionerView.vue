<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import alumniService from '@/services/alumniService'
import { useAlumni } from '../stores/alumni'
import { useSubmissions } from '../stores/submissions'
import { useQuestionnaires } from '../stores/questionnaires'

// State sederhana (tanpa store/admin untuk kuisioner)
const form = reactive({
  nama: '',
  nik: '',
  alamat: '',
  noHp: '',
  nim: '',
  fakultas: '',
  prodi: '',
  tahun: '',
  email: '',
  status: '',
  ekstra: '',
  // status bekerja detail
  bekerja_lebihCepat6Bulan: '',
  bekerja_bulanDapat: '',
  bekerja_bulanTidak: '',
  bekerja_pendapatan: '',
  bekerja_tingkatTempatKerja: '',
  bekerja_lokasiDetail: '',
  bekerja_provinsi: '',
  bekerja_kabupaten: '',
  bekerja_jenisPerusahaan: '',
  bekerja_namaPerusahaan: '',
  bekerja_namaPimpinan: '',
  bekerja_telpPerusahaan: '',
  bekerja_mulaiSebelum: '',
  bekerja_mulaiSetelah: '',
  bekerja_caraMencari: [],
  bekerja_perusahaanLamar: '',
  bekerja_perusahaanRespon: '',
  bekerja_perusahaanWawancara: '',
  bekerja_alasanTidakSesuai: [],
  bekerja_posisi: '',
  bekerja_kesesuaianBidang: '',
  bekerja_pendidikanSesuai: '',
  // wiraswasta detail
  wira_namaPerusahaan: '',
  wira_telpPerusahaan: '',
  wira_jenisPerusahaan: '',
  wira_bidang: '',
  wira_tingkat: '',
  wira_kesesuaian: '',
  wira_pendidikan: '',
  // studi lanjut detail
  studi_lokasi: '',
  studi_sumberBiaya: '',
  studi_namaPt: '',
  studi_prodi: '',
  studi_tanggalMasuk: '',
  studi_alasan: '',
  // mencari kerja detail
  mencari_mulaiSebelum: '',
  mencari_mulaiSetelah: '',
  mencari_cara: [],
  mencari_perusahaanLamar: '',
  mencari_perusahaanRespon: '',
  mencari_perusahaanWawancara: '',
  mencari_aktif4Minggu: '',
  sumberDana: '',
  kompetensi_individu: {
    etika: '',
    keahlian: '',
    bahasa: '',
    teknologi: '',
    komunikasi: '',
    kerjasama: '',
    pengembangan: '',
  },
  kompetensi_pembelajaran: {
    perkuliahan: '',
    demonstrasi: '',
    riset: '',
    magang: '',
    praktikum: '',
    kerjaLapangan: '',
    diskusi: '',
  },
})

const sent = ref(false)
const nimInput = ref('')
const lookupMessage = ref('')
const lookupError = ref('')
const tokenInfo = ref(null)
const tokenError = ref('')
const formLocked = ref(false)
const lookupLoading = ref(false)
const attemptNotice = ref('')

const route = useRoute()
const { alumni, fetchAlumni } = useAlumni()
const { submissions, addSubmission, attemptsByNim } = useSubmissions()
const {
  activeQuestionnaire,
  fetchActiveQuestionnaire,
  fetchQuestions,
  questionsById,
  questionsLoading,
  questionsError,
} = useQuestionnaires()
const activeAlumniQuestionnaire = computed(() => activeQuestionnaire.value)
const questionnaireQuestions = computed(() =>
  activeAlumniQuestionnaire.value?.id ? questionsById(activeAlumniQuestionnaire.value.id) : [],
)
const alumniItems = computed(() => alumni.value.items || [])

const pickField = (obj, candidates = []) => {
  if (!obj || typeof obj !== 'object') return undefined
  for (const key of candidates) {
    if (obj[key] !== undefined) return obj[key]
    const lowerKey = Object.keys(obj).find((k) => k.toLowerCase() === key.toLowerCase())
    if (lowerKey) return obj[lowerKey]
  }
  return undefined
}

const normalizeAlumniItem = (item) => {
  if (!item) return null
  const nim = pickField(item, ['nim', 'studentId', 'student_id', 'id'])
  return {
    nama: pickField(item, ['nama', 'name', 'fullName', 'full_name']) || '',
    nim: String(nim || '').trim(),
    nik: pickField(item, ['nik', 'nationalId', 'national_id']) || '',
    noHp: pickField(item, ['noHp', 'phone', 'telepon', 'phoneNumber', 'phone_number']) || '',
    alamat: pickField(item, ['alamat', 'address', 'alamat_domisili', 'alamatDomisili']) || '',
    prodi: pickField(item, ['prodi', 'programStudi', 'program', 'program_studi']) || '',
    fakultas: pickField(item, ['fakultas', 'faculty', 'fakultas_name', 'faculty_name']) || '',
    tahunLulus: pickField(item, ['tahunLulus', 'graduationYear', 'graduation_year', 'tahun']) || '',
    email: pickField(item, ['email', 'alamatEmail', 'mail', 'email_address']) || '',
    dob: pickField(item, ['dob', 'tglLahir', 'birthDate', 'birth_date']) || '',
  }
}

const normalizeAlumniList = (payload) => {
  const hasCoreFields = (obj) =>
    obj &&
    typeof obj === 'object' &&
    ['nim', 'studentId', 'student_id', 'id', 'name', 'nama'].some(
      (k) => pickField(obj, [k]) !== undefined,
    )

  const visit = (obj) => {
    if (!obj) return null
    if (Array.isArray(obj)) return obj
    if (hasCoreFields(obj)) return [obj]
    const keys = ['data', 'items', 'alumni', 'result', 'payload']
    for (const key of keys) {
      if (Array.isArray(obj[key])) return obj[key]
      if (obj[key] && typeof obj[key] === 'object') {
        const nested = visit(obj[key])
        if (nested) return nested
      }
    }
    return null
  }

  const rawList = visit(payload)
  if (!rawList) return []
  const arr = Array.isArray(rawList) ? rawList : [rawList]
  return arr.map(normalizeAlumniItem).filter(Boolean)
}

const tryApplyAlumniPayload = (payload) => {
  const [match] = normalizeAlumniList(payload)
  if (!match) return false
  applyAlumniData(match)
  return true
}

const applyAlumniData = (data) => {
  if (!data) return
  form.nama = data.nama || form.nama
  form.nim = data.nim || form.nim
  form.nik = data.nik || form.nik
  form.noHp = data.noHp || form.noHp
  form.alamat = data.alamat || form.alamat
  form.prodi = data.prodi || form.prodi
  form.fakultas = data.fakultas || form.fakultas
  form.tahun = data.tahunLulus || form.tahun
  form.email = data.email || form.email
}

const provinces = [
  'Aceh',
  'Sumatera Utara',
  'Sumatera Barat',
  'Riau',
  'Kepulauan Riau',
  'Jambi',
  'Bengkulu',
  'Sumatera Selatan',
  'Lampung',
  'Bangka Belitung',
  'Banten',
  'DKI Jakarta',
  'Jawa Barat',
  'Jawa Tengah',
  'DI Yogyakarta',
  'Jawa Timur',
  'Bali',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Kalimantan Barat',
  'Kalimantan Tengah',
  'Kalimantan Selatan',
  'Kalimantan Timur',
  'Kalimantan Utara',
  'Sulawesi Utara',
  'Sulawesi Tengah',
  'Sulawesi Selatan',
  'Sulawesi Tenggara',
  'Gorontalo',
  'Maluku',
  'Maluku Utara',
  'Papua',
  'Papua Barat',
]

const kabupatenMap = {
  'DKI Jakarta': ['Jakarta Pusat', 'Jakarta Barat', 'Jakarta Timur', 'Jakarta Selatan', 'Jakarta Utara'],
  'Jawa Barat': ['Bandung', 'Bekasi', 'Bogor', 'Depok', 'Cirebon'],
  'Jawa Tengah': ['Semarang', 'Surakarta', 'Magelang', 'Purwokerto', 'Tegal'],
  'DI Yogyakarta': ['Kota Yogyakarta', 'Bantul', 'Sleman', 'Gunungkidul', 'Kulon Progo'],
  'Jawa Timur': ['Surabaya', 'Malang', 'Sidoarjo', 'Gresik', 'Kediri'],
  Banten: ['Tangerang', 'Serang', 'Cilegon', 'Pandeglang'],
  Bali: ['Denpasar', 'Badung', 'Tabanan', 'Gianyar'],
  'Sumatera Utara': ['Medan', 'Binjai', 'Tebing Tinggi', 'Pematang Siantar'],
  'Sumatera Barat': ['Padang', 'Bukittinggi', 'Payakumbuh'],
  Riau: ['Pekanbaru', 'Dumai', 'Siak'],
  'Kepulauan Riau': ['Batam', 'Tanjungpinang', 'Bintan'],
  'Sumatera Selatan': ['Palembang', 'Lubuklinggau', 'Prabumulih'],
  Lampung: ['Bandar Lampung', 'Metro', 'Lampung Selatan'],
  'Kalimantan Timur': ['Balikpapan', 'Samarinda', 'Bontang'],
  'Sulawesi Selatan': ['Makassar', 'Parepare', 'Palopo'],
  'Nusa Tenggara Barat': ['Mataram', 'Bima', 'Lombok Tengah'],
  'Nusa Tenggara Timur': ['Kupang', 'Ende', 'Maumere'],
  default: ['Kota/Kabupaten utama 1', 'Kota/Kabupaten utama 2'],
}

const provinceQuery = ref('')
const kabupatenQuery = ref('')

const filteredProvinces = computed(() => {
  const q = provinceQuery.value.trim().toLowerCase()
  if (!q) return provinces
  return provinces.filter((p) => p.toLowerCase().includes(q))
})

const filteredKabupaten = computed(() => {
  const base = kabupatenMap[form.bekerja_provinsi] || kabupatenMap.default || []
  const q = kabupatenQuery.value.trim().toLowerCase()
  if (!q) return base
  return base.filter((k) => k.toLowerCase().includes(q))
})

const skorOptions = ['1', '2', '3', '4', '5']
const showNimModal = ref(false)
const searchName = ref('')
const searchDob = ref('')
const searchResultNim = ref('')
const searchMessage = ref('')
const searchError = ref('')
const searchLoading = ref(false)
const attemptHistory = computed(() => {
  const nimKey = (form.nim || nimInput.value || '').trim()
  if (!nimKey || !attemptsByNim) return []
  return attemptsByNim(nimKey, 'alumni')
})

onMounted(async () => {
  await Promise.all([fetchAlumni(), fetchActiveQuestionnaire('alumni')])
  if (activeAlumniQuestionnaire.value?.id) {
    fetchQuestions(activeAlumniQuestionnaire.value.id)
  }
  await validateTokenFromQuery()
})

const validateTokenFromQuery = async () => {
  const token = route.query?.token
  if (!token) return
  try {
    const decoded = JSON.parse(atob(String(token)))
    const exp = Number(decoded.exp)
    if (!decoded.nim || Number.isNaN(exp)) {
      throw new Error('Token tidak valid.')
    }
    if (Date.now() > exp) {
      tokenError.value = 'Link kuisioner sudah kedaluwarsa. Minta tautan baru dari admin.'
      formLocked.value = true
      return
    }
    tokenInfo.value = { ...decoded, exp }
    nimInput.value = decoded.nim
    await handleApplyNim()
    const expireDate = new Date(exp).toLocaleDateString('id-ID', { dateStyle: 'medium' })
    lookupMessage.value = `Data alumni otomatis diisi dari tautan khusus. Link aktif sampai ${expireDate}.`
  } catch (err) {
    tokenError.value = err?.message || 'Token tidak valid.'
    formLocked.value = true
  }
}

const handleApplyNim = async () => {
  lookupMessage.value = ''
  lookupError.value = ''
  const nim = nimInput.value.trim()
  if (!nim) {
    lookupError.value = 'Isi NIM terlebih dahulu.'
    return
  }
  lookupLoading.value = true
  let lastError = ''
  let applied = false
  try {
    const resp = await alumniService.searchAlumni({ nim })
    applied = tryApplyAlumniPayload(resp)
    if (applied) {
      lookupMessage.value = 'Data alumni ditemukan dan sudah diisikan ke formulir.'
    } else {
      lastError = 'Data alumni tidak ditemukan untuk NIM tersebut.'
    }
  } catch (err) {
    lastError = err?.message || 'Data alumni tidak ditemukan untuk NIM tersebut.'
  }

  if (!applied) {
    try {
      const resp = await alumniService.getAlumni({ nim })
      applied = tryApplyAlumniPayload(resp)
      if (applied) {
        lookupMessage.value = 'Data alumni ditemukan dan sudah diisikan ke formulir.'
      }
    } catch (err) {
      lastError = err?.message || lastError
    }
  }

  if (!applied) {
    try {
      const resp = await alumniService.getAlumniById(nim)
      applied = tryApplyAlumniPayload(resp)
      if (applied) {
        lookupMessage.value = 'Data alumni ditemukan dan sudah diisikan ke formulir.'
      }
    } catch (err) {
      lastError = err?.message || lastError
    }
  }

  if (!applied) {
    const localMatch = alumniItems.value.find((item) => String(item.nim) === String(nim))
    if (localMatch) {
      applyAlumniData(localMatch)
      applied = true
      lookupMessage.value = 'Data alumni ditemukan dari data lokal.'
    }
  }

  lookupLoading.value = false
  if (applied) return
  lookupError.value = lastError || 'Data alumni tidak ditemukan untuk NIM tersebut.'
}

const openNimModal = () => {
  searchName.value = ''
  searchDob.value = ''
  searchResultNim.value = ''
  searchMessage.value = ''
  searchError.value = ''
  showNimModal.value = true
}

const closeNimModal = () => {
  showNimModal.value = false
}

const handleSearchNim = async () => {
  searchMessage.value = ''
  searchError.value = ''
  searchResultNim.value = ''
  const name = searchName.value.trim()
  const dob = searchDob.value.trim()
  if (!name && !dob) {
    searchError.value = 'Nama atau tanggal lahir wajib diisi.'
    return
  }
  searchLoading.value = true
  try {
    const resp = await alumniService.searchAlumni({ name, dob })
    const results = normalizeAlumniList(resp)
    const match =
      results.find((item) => {
        const nameMatch = name ? (item.nama || '').toLowerCase().includes(name.toLowerCase()) : true
        const dobMatch = dob ? String(item.dob || '') === dob : true
        return nameMatch && dobMatch
      }) || results[0]
    if (!match?.nim) {
      searchError.value = 'NIM tidak ditemukan untuk nama dan tanggal lahir tersebut.'
      return
    }
    searchResultNim.value = match.nim
    searchMessage.value = 'NIM ditemukan. Anda bisa menyalinnya.'
  } catch (err) {
    searchError.value = err?.message || 'NIM tidak ditemukan untuk nama dan tanggal lahir tersebut.'
  } finally {
    searchLoading.value = false
  }
}

const copyNim = async () => {
  if (!searchResultNim.value) return
  try {
    await navigator.clipboard.writeText(searchResultNim.value)
    searchMessage.value = 'NIM sudah disalin ke clipboard.'
  } catch (e) {
    searchError.value = 'Gagal menyalin NIM.'
  }
}

const submitForm = async () => {
  if (formLocked.value) {
    lookupError.value = tokenError.value || 'Link kuisioner tidak aktif. Minta tautan baru.'
    return
  }
  const snapshot = JSON.parse(JSON.stringify(form))
  const result = await addSubmission({
    type: 'alumni',
    audience: 'alumni',
    nama: snapshot.nama || '',
    prodi: snapshot.prodi || '',
    fakultas: snapshot.fakultas || '',
    tahun: snapshot.tahun || '',
    status: snapshot.status || '',
    waitMonths: snapshot.bekerja_bulanDapat || snapshot.bekerja_bulanTidak || '',
    salary: snapshot.bekerja_pendapatan || '',
    industry:
      snapshot.bekerja_jenisPerusahaan ||
      snapshot.wira_jenisPerusahaan ||
      snapshot.wira_bidang ||
      '',
    province: snapshot.bekerja_provinsi || snapshot.studi_lokasi || '',
    raw: snapshot,
  })
  if (result?.attemptNumber) {
    attemptNotice.value = `Terima kasih, ini pengisian kuisioner ke-${result.attemptNumber} Anda.`
  } else {
    attemptNotice.value = 'Terima kasih, pengisian kuisioner telah tersimpan.'
  }
  sent.value = true
  setTimeout(() => {
    sent.value = false
  }, 2000)
}
</script>

<template>
  <div class="space-y-6">
    <div class="rounded-xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700">
      Halaman kuisioner alumni (statis, tanpa data admin). Jika Anda melihat teks ini, komponen aktif.
    </div>

    <header class="space-y-2">
      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Kuisioner</p>
      <h1 class="text-3xl font-semibold text-slate-900">
        {{ activeAlumniQuestionnaire?.title || 'Isi kuisioner alumni' }}
      </h1>
      <p class="text-slate-600">
        {{ activeAlumniQuestionnaire?.description || 'Form ini dibuat statis untuk debugging. Silakan isi data di bawah dan cek tampilannya.' }}
      </p>
      <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span class="rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-700">
          {{ activeAlumniQuestionnaire?.estimatedTime || '+/-5 menit' }}
        </span>
        <span v-if="questionsLoading" class="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
          Memuat pertanyaan...
        </span>
        <span v-if="questionsError" class="rounded-full bg-rose-50 px-3 py-1 font-semibold text-rose-700">
          {{ questionsError }}
        </span>
      </div>
    </header>

    <div
      v-if="tokenError"
      class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700"
    >
      {{ tokenError }}
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p class="text-sm font-semibold text-slate-900">Cek data kelulusan</p>
      <p class="text-xs text-slate-600">Masukkan NIM alumni untuk menarik data dasar (nama, prodi, fakultas, tahun lulus).</p>
      <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <textarea
          v-model="nimInput"
          rows="1"
          class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Masukkan NIM alumni, contoh: 190102001"
        />
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            class="rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 px-5 py-2 text-sm font-semibold text-white shadow sm:w-auto w-full"
            :disabled="lookupLoading"
            :class="lookupLoading ? 'opacity-70 cursor-not-allowed' : ''"
            @click="handleApplyNim"
          >
            {{ lookupLoading ? 'Memuat...' : 'Apply' }}
          </button>
          <button
            type="button"
            class="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-sm font-semibold text-white shadow sm:w-auto w-full"
            @click="openNimModal"
          >
            Cari NIM
          </button>
        </div>
      </div>
      <p v-if="lookupMessage" class="mt-2 text-xs font-semibold text-emerald-600">{{ lookupMessage }}</p>
      <p v-if="lookupError" class="mt-2 text-xs font-semibold text-rose-600">{{ lookupError }}</p>
    </div>

    <form class="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow" @submit.prevent="submitForm">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="block text-sm font-semibold text-slate-900">Nama</label>
          <input v-model="form.nama" class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2" required />
        </div>
        <div>
          <label class="block text-sm font-semibold text-slate-900">NIK</label>
          <input v-model="form.nik" class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2" />
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="block text-sm font-semibold text-slate-900">Alamat</label>
          <input v-model="form.alamat" class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-slate-900">No HP</label>
          <input v-model="form.noHp" class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2" />
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="block text-sm font-semibold text-slate-900">NIM</label>
          <input v-model="form.nim" class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-slate-900">Fakultas</label>
          <input v-model="form.fakultas" class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2" />
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="block text-sm font-semibold text-slate-900">Program Studi</label>
          <input v-model="form.prodi" class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-slate-900">Tahun Lulus</label>
          <input v-model="form.tahun" class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-semibold text-slate-900">Status</label>
        <select v-model="form.status" class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2">
          <option value="">Pilih status</option>
          <option value="bekerja">Bekerja</option>
          <option value="wiraswasta">Wiraswasta</option>
          <option value="melanjutkan">Melanjutkan pendidikan</option>
          <option value="mencari">Mencari kerja</option>
          <option value="belum">Belum memungkinkan bekerja</option>
        </select>
      </div>

      <div v-if="form.status === 'bekerja'" class="space-y-4 rounded-2xl bg-slate-50 p-4 text-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Detail bekerja</p>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="text-sm font-semibold text-slate-900">Mulai mencari pekerjaan ... bulan sebelum lulus</label>
            <input
              v-model="form.bekerja_mulaiSebelum"
              type="number"
              min="0"
              class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Contoh: 2"
            />
          </div>
          <div>
            <label class="text-sm font-semibold text-slate-900">Mulai mencari pekerjaan ... bulan setelah lulus</label>
            <input
              v-model="form.bekerja_mulaiSetelah"
              type="number"
              min="0"
              class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Contoh: 1"
            />
          </div>
        </div>

        <div>
          <label class="text-sm font-semibold text-slate-900">
            Apakah Anda telah mendapatkan pekerjaan ≤6 bulan/termasuk sebelum lulus?
          </label>
          <div class="mt-2 flex flex-wrap gap-3 text-sm text-slate-700">
            <label class="inline-flex items-center gap-2">
              <input v-model="form.bekerja_lebihCepat6Bulan" type="radio" value="iya" />
              <span>Iya</span>
            </label>
            <label class="inline-flex items-center gap-2">
              <input v-model="form.bekerja_lebihCepat6Bulan" type="radio" value="tidak" />
              <span>Tidak</span>
            </label>
          </div>
        </div>

        <div v-if="form.bekerja_lebihCepat6Bulan === 'iya'">
          <label class="text-sm font-semibold text-slate-900">Berapa bulan mendapatkan pekerjaan?</label>
          <input
            v-model="form.bekerja_bulanDapat"
            type="number"
            min="0"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
            placeholder="Contoh: 2"
          />
        </div>
        <div v-else-if="form.bekerja_lebihCepat6Bulan === 'tidak'">
          <label class="text-sm font-semibold text-slate-900">Berapa bulan mendapatkan pekerjaan?</label>
          <input
            v-model="form.bekerja_bulanTidak"
            type="number"
            min="0"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
            placeholder="Contoh: 8"
          />
        </div>

        <div>
          <label class="text-sm font-semibold text-slate-900">Berapa rata-rata pendapatan Anda per bulan?</label>
          <select
            v-model="form.bekerja_pendapatan"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="">Pilih</option>
            <option value="<1juta">Kurang dari 1 juta</option>
            <option value="1-3juta">Antara 1 - 3 juta</option>
            <option value="3-5juta">Antara 3 - 5 juta</option>
            <option value=">5juta">Di atas 5 juta</option>
          </select>
        </div>

        <div>
          <label class="text-sm font-semibold text-slate-900">Tingkat tempat kerja Anda</label>
          <select
            v-model="form.bekerja_tingkatTempatKerja"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="">Pilih tingkat</option>
            <option>Lokal/wilayah/wiraswasta tidak berbadan hukum</option>
            <option>Nasional/wiraswasta berbadan hukum</option>
            <option>Multinasional/internasional</option>
            <option>Lainnya</option>
          </select>
        </div>

        <div>
          <label class="text-sm font-semibold text-slate-900">Dimanakah lokasi tempat Anda bekerja?</label>
          <input
            v-model="form.bekerja_lokasiDetail"
            type="text"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
            placeholder="Contoh: Jakarta, remote, luar negeri, dsb."
          />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="text-sm font-semibold text-slate-900">Provinsi lokasi bekerja</label>
            <input
              v-model="provinceQuery"
              type="text"
              class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Filter provinsi..."
            />
            <select
              v-model="form.bekerja_provinsi"
              class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">Pilih provinsi</option>
              <option v-for="prov in filteredProvinces" :key="prov" :value="prov">{{ prov }}</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-semibold text-slate-900">Kabupaten/Kota lokasi bekerja</label>
            <input
              v-model="kabupatenQuery"
              type="text"
              class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Filter kab/kota..."
            />
            <select
              v-model="form.bekerja_kabupaten"
              class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">Pilih kabupaten/kota</option>
              <option v-for="kab in filteredKabupaten" :key="kab" :value="kab">{{ kab }}</option>
            </select>
          </div>
        </div>

        <div>
          <label class="text-sm font-semibold text-slate-900">Jenis perusahaan/instansi tempat Anda bekerja</label>
          <select
            v-model="form.bekerja_jenisPerusahaan"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="">Pilih jenis</option>
            <option>Instansi Pemerintah</option>
            <option>BUMN / BUMD</option>
            <option>Institusi / Organisasi Multilateral</option>
            <option>Organisasi Non-profit / LSM</option>
            <option>Perusahaan Swasta</option>
            <option>Wiraswasta / Perusahaan Sendiri</option>
            <option>Lembaga / Yayasan</option>
            <option>Lainnya</option>
          </select>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="text-sm font-semibold text-slate-900">Nama perusahaan/kantor</label>
            <input
              v-model="form.bekerja_namaPerusahaan"
              type="text"
              class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </div>
          <div>
            <label class="text-sm font-semibold text-slate-900">Nama pimpinan</label>
            <input
              v-model="form.bekerja_namaPimpinan"
              type="text"
              class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label class="text-sm font-semibold text-slate-900">Nomor telepon/HP perusahaan/pimpinan</label>
          <input
            v-model="form.bekerja_telpPerusahaan"
            type="text"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </div>

        <div>
          <label class="text-sm font-semibold text-slate-900">Bagaimana Anda mencari pekerjaan?</label>
          <p class="text-xs text-slate-500">Pilih lebih dari satu bila diperlukan.</p>
          <div class="mt-2 grid gap-2 sm:grid-cols-2">
            <label class="inline-flex items-start gap-2 text-sm text-slate-700" v-for="opt in [
              'Melalui iklan di koran/majalah, brosur',
              'Melamar ke perusahaan tanpa mengetaui lowongan yang ada',
              'Pergi ke bursa/pameran kerja',
              'Mencari lewat internet/iklan online/milis',
              'Dihubungi oleh perusahaan',
              'Menghubungi Kemenakertrans',
              'Menghubungi agen tenaga kerja komersial/swasta',
              'Memperoleh informasi dari pusat pengembangan karir fakultas/universitas',
              'Menghubungi kantor kemahasiswaan/hubungan alumni',
              'Membangun jejaring (network) sejak masih kuliah',
              'Melalui relasi (misalnya dosen, orang tua, saudara, teman, dll)',
              'Membangun bisnis sendiri',
              'Melalui penempatan kerja atau magang',
              'Bekerja di tempat yang sama dengan tempat kerja semasa kuliah',
              'Lainnya',
            ]" :key="opt">
              <input
                v-model="form.bekerja_caraMencari"
                type="checkbox"
                :value="opt"
                class="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              <span>{{ opt }}</span>
            </label>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <label class="text-sm font-semibold text-slate-900">Berapa perusahaan yang Anda lamar sebelum memperoleh pekerjaan?</label>
            <input
              v-model="form.bekerja_perusahaanLamar"
              type="number"
              min="0"
              class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </div>
          <div>
            <label class="text-sm font-semibold text-slate-900">Berapa perusahaan yang merespons lamaran Anda?</label>
            <input
              v-model="form.bekerja_perusahaanRespon"
              type="number"
              min="0"
              class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </div>
          <div>
            <label class="text-sm font-semibold text-slate-900">Berapa perusahaan yang mengundang Anda wawancara?</label>
            <input
              v-model="form.bekerja_perusahaanWawancara"
              type="number"
              min="0"
              class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label class="text-sm font-semibold text-slate-900">Jika pekerjaan tidak sesuai pendidikan, mengapa diambil?</label>
          <p class="text-xs text-slate-500">Pilih lebih dari satu bila diperlukan.</p>
          <div class="mt-2 grid gap-2 sm:grid-cols-2">
            <label class="inline-flex items-start gap-2 text-sm text-slate-700" v-for="opt in [
              'Saya belum mendapatkan pekerjaan yang lebih sesuai dengan pendidikan saya',
              'Di pekerjaan ini saya memperoleh prospek karir yang baik',
              'Saya lebih suka bekerja di area pekerjaan yang tidak ada hubungannya dengan pendidikan saya',
              'Saya dipromosikan ke posisi yang kurang berhubungan dengan pendidikan saya dibanding posisi sebelumnya',
              'Saya dapat memperoleh pendapatan yang lebih tinggi di pekerjaan ini',
              'Pekerjaan saya saat ini lebih aman/terjamin/secure',
              'Pekerjaan saya saat ini lebih menarik',
              'Pekerjaan saya saat ini lebih memungkinkan saya mengambil pekerjaan tambahan/jadwal yang fleksibel, dll',
              'Pekerjaan saya saat ini lokasinya lebih dekat dari rumah saya',
              'Pekerjaan saya saat ini dpt lebih menjamin kebutuhan keluarga',
              'Pada awal meniti karir ini, saya harus menerima pekerjaan yang tidak berhubungan dengan pendidikan saya',
              'Lainnya',
            ]" :key="opt">
              <input
                v-model="form.bekerja_alasanTidakSesuai"
                type="checkbox"
                :value="opt"
                class="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              <span>{{ opt }}</span>
            </label>
          </div>
        </div>

        <div>
          <label class="text-sm font-semibold text-slate-900">Posisi/Jabatan saat ini</label>
          <select
            v-model="form.bekerja_posisi"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="">Pilih posisi</option>
            <option>Founder</option>
            <option>Co-Founder</option>
            <option>Staff</option>
            <option>Freelance/Kerja Lepas</option>
            <option>Lainnya</option>
          </select>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="text-sm font-semibold text-slate-900">Seberapa erat hubungan bidang studi dengan pekerjaan Anda?</label>
            <select
              v-model="form.bekerja_kesesuaianBidang"
              class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">Pilih</option>
              <option>Sangat erat</option>
              <option>Erat</option>
              <option>Cukup erat</option>
              <option>Kurang erat</option>
              <option>Tidak sama sekali</option>
              <option>Lainnya</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-semibold text-slate-900">Tingkat pendidikan paling sesuai untuk pekerjaan Anda?</label>
            <select
              v-model="form.bekerja_pendidikanSesuai"
              class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">Pilih</option>
              <option>Setingkat Lebih Tinggi</option>
              <option>Tingkat yang Sama</option>
              <option>Setingkat Lebih Rendah</option>
              <option>Tidak Perlu Pendidikan tinggi</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-slate-900">Sumber dana pembiayaan kuliah</label>
          <select
            v-model="form.sumberDana"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="">Pilih sumber dana</option>
            <option>Biaya Sendiri/Keluarga</option>
            <option>Beasiswa ADik (Afirmasi Pendidikan Tinggi)</option>
            <option>Beasiswa KIP-K (Kartu Indonesia Pintar Kuliah)/Bidikmisi</option>
            <option>Beasiswa PPA (Peningkatan Prestasi Akademik)</option>
            <option>Beasiswa AFIRMASI</option>
            <option>Beasiswa Perusahaan/Swasta</option>
            <option>Lainnya</option>
          </select>
        </div>

        <div class="space-y-3 rounded-xl bg-white/60 p-3">
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">D. Penilaian Kompetensi Individu</p>
          <div class="grid gap-3 sm:grid-cols-2">
            <div v-for="(label, key) in {
              etika: 'Etika',
              keahlian: 'Keahlian berdasarkan bidang',
              bahasa: 'Bahasa Inggris',
              teknologi: 'Penggunaan Teknologi Informasi',
              komunikasi: 'Komunikasi',
              kerjasama: 'Kerjasama tim',
              pengembangan: 'Pengembangan diri',
            }" :key="key" class="space-y-1">
              <label class="text-sm font-semibold text-slate-900">{{ label }}</label>
              <div class="flex flex-wrap gap-2 text-sm text-slate-700">
                <label v-for="opt in skorOptions" :key="`${key}-${opt}`" class="inline-flex items-center gap-1">
                  <input
                    v-model="form.kompetensi_individu[key]"
                    type="radio"
                    :value="opt"
                    class="h-4 w-4"
                  />
                  <span>{{ opt }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-3 rounded-xl bg-white/60 p-3">
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">E. Penilaian Kompetensi Pembelajaran</p>
          <div class="grid gap-3 sm:grid-cols-2">
            <div v-for="(label, key) in {
              perkuliahan: 'Perkuliahan',
              demonstrasi: 'Demonstrasi',
              riset: 'Proyek riset',
              magang: 'Magang',
              praktikum: 'Praktikum',
              kerjaLapangan: 'Kerja lapangan',
              diskusi: 'Diskusi',
            }" :key="`pemb-${key}`" class="space-y-1">
              <label class="text-sm font-semibold text-slate-900">{{ label }}</label>
              <div class="flex flex-wrap gap-2 text-sm text-slate-700">
                <label v-for="opt in skorOptions" :key="`pb-${key}-${opt}`" class="inline-flex items-center gap-1">
                  <input
                    v-model="form.kompetensi_pembelajaran[key]"
                    type="radio"
                    :value="opt"
                    class="h-4 w-4"
                  />
                  <span>{{ opt }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="form.status === 'wiraswasta'" class="space-y-4 rounded-2xl bg-slate-50 p-4 text-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Detail wiraswasta</p>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="text-sm font-semibold text-slate-900">Nama perusahaan/kantor tempat berwiraswasta</label>
            <input
              v-model="form.wira_namaPerusahaan"
              type="text"
              class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div>
            <label class="text-sm font-semibold text-slate-900">Nomor telepon/HP perusahaan/pimpinan</label>
            <input
              v-model="form.wira_telpPerusahaan"
              type="text"
              class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
            />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="text-sm font-semibold text-slate-900">Jenis perusahaan tempat berwiraswasta</label>
            <select
              v-model="form.wira_jenisPerusahaan"
              class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            >
              <option value="">Pilih jenis</option>
              <option>Institusi/Organisasi Multilateral</option>
              <option>Organisasi non-profit/Lembaga Swadaya Masyarakat</option>
              <option>Perusahaan swasta</option>
              <option>Wiraswasta/perusahaan sendiri</option>
              <option>Lembaga/Yayasan</option>
              <option>Lainnya</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-semibold text-slate-900">Bidang/sektor wiraswasta</label>
            <input
              v-model="form.wira_bidang"
              type="text"
              class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
              placeholder="Contoh: Kuliner, teknologi, jasa, dsb."
            />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="text-sm font-semibold text-slate-900">Tingkat tempat kerja</label>
            <select
              v-model="form.wira_tingkat"
              class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            >
              <option value="">Pilih tingkat</option>
              <option>Lokal/wilayah/wiraswasta tidak berbadan hukum</option>
              <option>Nasional/wiraswasta berbadan hukum</option>
            <option>Multinasional/internasional</option>
            <option>Lainnya</option>
          </select>
        </div>
          <div>
            <label class="text-sm font-semibold text-slate-900">Kesesuaian bidang studi dengan usaha</label>
            <select
              v-model="form.wira_kesesuaian"
              class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            >
              <option value="">Pilih kesesuaian</option>
              <option>Sangat Erat</option>
              <option>Erat</option>
              <option>Cukup Erat</option>
              <option>Kurang Erat</option>
              <option>Tidak Sama Sekali</option>
              <option>Lainnya</option>
            </select>
          </div>
        </div>

        <div>
          <label class="text-sm font-semibold text-slate-900">Tingkat pendidikan paling sesuai</label>
          <select
            v-model="form.wira_pendidikan"
            class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
          >
            <option value="">Pilih tingkat pendidikan</option>
            <option>Setingkat Lebih Tinggi</option>
            <option>Tingkat yang Sama</option>
            <option>Setingkat Lebih Rendah</option>
            <option>Tidak Perlu Pendidikan Tinggi</option>
            <option>Lainnya</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-semibold text-slate-900">Sumber dana pembiayaan kuliah</label>
          <select
            v-model="form.sumberDana"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="">Pilih sumber dana</option>
            <option>Biaya Sendiri/Keluarga</option>
            <option>Beasiswa ADik (Afirmasi Pendidikan Tinggi)</option>
            <option>Beasiswa KIP-K (Kartu Indonesia Pintar Kuliah)/Bidikmisi</option>
            <option>Beasiswa PPA (Peningkatan Prestasi Akademik)</option>
            <option>Beasiswa AFIRMASI</option>
            <option>Beasiswa Perusahaan/Swasta</option>
            <option>Lainnya</option>
          </select>
        </div>

        <div class="space-y-3 rounded-xl bg-white/60 p-3">
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">D. Penilaian Kompetensi Individu</p>
          <div class="grid gap-3 sm:grid-cols-2">
            <div v-for="(label, key) in {
              etika: 'Etika',
              keahlian: 'Keahlian berdasarkan bidang',
              bahasa: 'Bahasa Inggris',
              teknologi: 'Penggunaan Teknologi Informasi',
              komunikasi: 'Komunikasi',
              kerjasama: 'Kerjasama tim',
              pengembangan: 'Pengembangan diri',
            }" :key="`bekerja-ind-${key}`" class="space-y-1">
              <label class="text-sm font-semibold text-slate-900">{{ label }}</label>
              <div class="flex flex-wrap gap-2 text-sm text-slate-700">
                <label v-for="opt in skorOptions" :key="`bekerja-${key}-${opt}`" class="inline-flex items-center gap-1">
                  <input
                    v-model="form.kompetensi_individu[key]"
                    type="radio"
                    :value="opt"
                    class="h-4 w-4"
                  />
                  <span>{{ opt }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-3 rounded-xl bg-white/60 p-3">
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">E. Penilaian Kompetensi Pembelajaran</p>
          <div class="grid gap-3 sm:grid-cols-2">
            <div v-for="(label, key) in {
              perkuliahan: 'Perkuliahan',
              demonstrasi: 'Demonstrasi',
              riset: 'Proyek riset',
              magang: 'Magang',
              praktikum: 'Praktikum',
              kerjaLapangan: 'Kerja lapangan',
              diskusi: 'Diskusi',
            }" :key="`bekerja-pemb-${key}`" class="space-y-1">
              <label class="text-sm font-semibold text-slate-900">{{ label }}</label>
              <div class="flex flex-wrap gap-2 text-sm text-slate-700">
                <label v-for="opt in skorOptions" :key="`bekerja-pb-${key}-${opt}`" class="inline-flex items-center gap-1">
                  <input
                    v-model="form.kompetensi_pembelajaran[key]"
                    type="radio"
                    :value="opt"
                    class="h-4 w-4"
                  />
                  <span>{{ opt }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="form.status === 'melanjutkan'"
        class="space-y-4 rounded-2xl bg-slate-50 p-4 text-sm"
      >
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Detail studi lanjut</p>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="text-sm font-semibold text-slate-900">Lokasi studi lanjut</label>
            <select
              v-model="form.studi_lokasi"
              class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            >
              <option value="">Pilih lokasi</option>
              <option>Dalam Negeri</option>
              <option>Luar Negeri</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-semibold text-slate-900">Sumber biaya studi lanjut</label>
            <select
              v-model="form.studi_sumberBiaya"
              class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            >
              <option value="">Pilih sumber biaya</option>
              <option>Biaya Sendiri</option>
              <option>Beasiswa</option>
              <option>Lainnya</option>
            </select>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="text-sm font-semibold text-slate-900">Nama Perguruan Tinggi</label>
            <input
              v-model="form.studi_namaPt"
              type="text"
              class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              placeholder="Contoh: Universitas A"
            />
          </div>
          <div>
            <label class="text-sm font-semibold text-slate-900">Program Studi</label>
            <input
              v-model="form.studi_prodi"
              type="text"
              class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              placeholder="Contoh: Magister Manajemen"
            />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="text-sm font-semibold text-slate-900">Tanggal/Tahun Masuk</label>
            <input
              v-model="form.studi_tanggalMasuk"
              type="date"
              class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            />
          </div>
          <div>
            <label class="text-sm font-semibold text-slate-900">Alasan melanjutkan studi</label>
            <select
              v-model="form.studi_alasan"
              class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            >
              <option value="">Pilih alasan</option>
              <option>Tuntutan profesi</option>
              <option>Kesempatan beasiswa</option>
              <option>Prestise</option>
              <option>Belum ada keinginan untuk bekerja</option>
              <option>Lainnya</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-slate-900">Sumber dana pembiayaan kuliah</label>
          <select
            v-model="form.sumberDana"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="">Pilih sumber dana</option>
            <option>Biaya Sendiri/Keluarga</option>
            <option>Beasiswa ADik (Afirmasi Pendidikan Tinggi)</option>
            <option>Beasiswa KIP-K (Kartu Indonesia Pintar Kuliah)/Bidikmisi</option>
            <option>Beasiswa PPA (Peningkatan Prestasi Akademik)</option>
            <option>Beasiswa AFIRMASI</option>
            <option>Beasiswa Perusahaan/Swasta</option>
            <option>Lainnya</option>
          </select>
        </div>

        <div class="space-y-3 rounded-xl bg-white/60 p-3">
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">D. Penilaian Kompetensi Individu</p>
          <div class="grid gap-3 sm:grid-cols-2">
            <div v-for="(label, key) in {
              etika: 'Etika',
              keahlian: 'Keahlian berdasarkan bidang',
              bahasa: 'Bahasa Inggris',
              teknologi: 'Penggunaan Teknologi Informasi',
              komunikasi: 'Komunikasi',
              kerjasama: 'Kerjasama tim',
              pengembangan: 'Pengembangan diri',
            }" :key="`wira-ind-${key}`" class="space-y-1">
              <label class="text-sm font-semibold text-slate-900">{{ label }}</label>
              <div class="flex flex-wrap gap-2 text-sm text-slate-700">
                <label v-for="opt in skorOptions" :key="`wira-${key}-${opt}`" class="inline-flex items-center gap-1">
                  <input
                    v-model="form.kompetensi_individu[key]"
                    type="radio"
                    :value="opt"
                    class="h-4 w-4"
                  />
                  <span>{{ opt }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-3 rounded-xl bg-white/60 p-3">
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">E. Penilaian Kompetensi Pembelajaran</p>
          <div class="grid gap-3 sm:grid-cols-2">
            <div v-for="(label, key) in {
              perkuliahan: 'Perkuliahan',
              demonstrasi: 'Demonstrasi',
              riset: 'Proyek riset',
              magang: 'Magang',
              praktikum: 'Praktikum',
              kerjaLapangan: 'Kerja lapangan',
              diskusi: 'Diskusi',
            }" :key="`wira-pemb-${key}`" class="space-y-1">
              <label class="text-sm font-semibold text-slate-900">{{ label }}</label>
              <div class="flex flex-wrap gap-2 text-sm text-slate-700">
                <label v-for="opt in skorOptions" :key="`wira-pb-${key}-${opt}`" class="inline-flex items-center gap-1">
                  <input
                    v-model="form.kompetensi_pembelajaran[key]"
                    type="radio"
                    :value="opt"
                    class="h-4 w-4"
                  />
                  <span>{{ opt }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="form.status === 'mencari'" class="space-y-4 rounded-2xl bg-slate-50 p-4 text-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Detail mencari kerja</p>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="text-sm font-semibold text-slate-900">Mulai mencari pekerjaan ... bulan sebelum lulus</label>
            <input
              v-model="form.mencari_mulaiSebelum"
              type="number"
              min="0"
              class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              placeholder="Contoh: 2"
            />
          </div>
          <div>
            <label class="text-sm font-semibold text-slate-900">Mulai mencari pekerjaan ... bulan setelah lulus</label>
            <input
              v-model="form.mencari_mulaiSetelah"
              type="number"
              min="0"
              class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              placeholder="Contoh: 1"
            />
          </div>
        </div>

        <div>
          <label class="text-sm font-semibold text-slate-900">Cara Anda mencari pekerjaan (dapat pilih lebih dari 1)</label>
          <div class="mt-2 grid gap-2 sm:grid-cols-2">
            <label class="inline-flex items-start gap-2 text-sm text-slate-700" v-for="opt in [
              'Melalui iklan di koran/majalah, brosur',
              'Melamar ke perusahaan tanpa mengetaui lowongan yang ada',
              'Pergi ke bursa/pameran kerja',
              'Mencari lewat internet/iklan online/milis',
              'Dihubungi oleh perusahaan',
              'Menghubungi Kemenakertrans',
              'Menghubungi agen tenaga kerja komersial/swasta',
              'Memperoleh informasi dari pusat pengembangan karir fakultas/universitas',
              'Menghubungi kantor kemahasiswaan/hubungan alumni',
              'Membangun jejaring (network) sejak masih kuliah',
              'Melalui relasi (misalnya dosen, orang tua, saudara, teman, dll)',
              'Membangun bisnis sendiri',
              'Melalui penempatan kerja atau magang',
              'Bekerja di tempat yang sama dengan tempat kerja semasa kuliah',
              'Lainnya',
            ]" :key="opt">
              <input
                v-model="form.mencari_cara"
                type="checkbox"
                :value="opt"
                class="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              <span>{{ opt }}</span>
            </label>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <label class="text-sm font-semibold text-slate-900">Berapa perusahaan yang Anda lamar</label>
            <input
              v-model="form.mencari_perusahaanLamar"
              type="number"
              min="0"
              class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            />
          </div>
          <div>
            <label class="text-sm font-semibold text-slate-900">Berapa perusahaan yang merespons</label>
            <input
              v-model="form.mencari_perusahaanRespon"
              type="number"
              min="0"
              class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            />
          </div>
          <div>
            <label class="text-sm font-semibold text-slate-900">Berapa perusahaan yang mengundang wawancara</label>
            <input
              v-model="form.mencari_perusahaanWawancara"
              type="number"
              min="0"
              class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            />
          </div>
        </div>

        <div>
          <label class="text-sm font-semibold text-slate-900">Apakah Anda aktif mencari pekerjaan dalam 4 minggu terakhir?</label>
          <select
            v-model="form.mencari_aktif4Minggu"
            class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
          >
            <option value="">Pilih</option>
            <option>Tidak</option>
            <option>Tidak, tapi saya sedang menunggu hasil lamaran kerja</option>
            <option>Ya, saya akan mulai bekerja dalam 2 minggu ke depan</option>
            <option>Lainnya</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-semibold text-slate-900">Sumber dana pembiayaan kuliah</label>
          <select
            v-model="form.sumberDana"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="">Pilih sumber dana</option>
            <option>Biaya Sendiri/Keluarga</option>
            <option>Beasiswa ADik (Afirmasi Pendidikan Tinggi)</option>
            <option>Beasiswa KIP-K (Kartu Indonesia Pintar Kuliah)/Bidikmisi</option>
            <option>Beasiswa PPA (Peningkatan Prestasi Akademik)</option>
            <option>Beasiswa AFIRMASI</option>
            <option>Beasiswa Perusahaan/Swasta</option>
            <option>Lainnya</option>
          </select>
        </div>

        <div class="space-y-3 rounded-xl bg-white/60 p-3">
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">D. Penilaian Kompetensi Individu</p>
          <div class="grid gap-3 sm:grid-cols-2">
            <div v-for="(label, key) in {
              etika: 'Etika',
              keahlian: 'Keahlian berdasarkan bidang',
              bahasa: 'Bahasa Inggris',
              teknologi: 'Penggunaan Teknologi Informasi',
              komunikasi: 'Komunikasi',
              kerjasama: 'Kerjasama tim',
              pengembangan: 'Pengembangan diri',
            }" :key="`wira-ind-${key}`" class="space-y-1">
              <label class="text-sm font-semibold text-slate-900">{{ label }}</label>
              <div class="flex flex-wrap gap-2 text-sm text-slate-700">
                <label v-for="opt in skorOptions" :key="`wira-${key}-${opt}`" class="inline-flex items-center gap-1">
                  <input
                    v-model="form.kompetensi_individu[key]"
                    type="radio"
                    :value="opt"
                    class="h-4 w-4"
                  />
                  <span>{{ opt }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-3 rounded-xl bg-white/60 p-3">
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">E. Penilaian Kompetensi Pembelajaran</p>
          <div class="grid gap-3 sm:grid-cols-2">
            <div v-for="(label, key) in {
              perkuliahan: 'Perkuliahan',
              demonstrasi: 'Demonstrasi',
              riset: 'Proyek riset',
              magang: 'Magang',
              praktikum: 'Praktikum',
              kerjaLapangan: 'Kerja lapangan',
              diskusi: 'Diskusi',
            }" :key="`wira-pemb-${key}`" class="space-y-1">
              <label class="text-sm font-semibold text-slate-900">{{ label }}</label>
              <div class="flex flex-wrap gap-2 text-sm text-slate-700">
                <label v-for="opt in skorOptions" :key="`wira-pb-${key}-${opt}`" class="inline-flex items-center gap-1">
                  <input
                    v-model="form.kompetensi_pembelajaran[key]"
                    type="radio"
                    :value="opt"
                    class="h-4 w-4"
                  />
                  <span>{{ opt }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label class="block text-sm font-semibold text-slate-900">Masukan singkat</label>
        <textarea v-model="form.ekstra" rows="3" class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2" />
      </div>

      <div class="flex items-center justify-between pt-2">
        <p class="text-xs text-slate-500">Form statis untuk pengecekan tampilan.</p>
        <button
          type="submit"
          class="rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 px-6 py-2 text-sm font-semibold text-white shadow"
        >
          Kirim kuisioner
        </button>
      </div>

      <div v-if="sent" class="space-y-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
        <p>{{ attemptNotice || 'Data terkirim.' }}</p>
        <p v-if="attemptHistory.length" class="text-[11px] font-semibold text-emerald-700/90">
          Riwayat: sudah {{ attemptHistory.length }} kali mengisi. Terakhir pengisian ke-{{ attemptHistory[0]?.attemptNumber }}.
        </p>
      </div>
    </form>

    <div v-if="attemptHistory.length" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">Riwayat pengisian</p>
      <h3 class="text-lg font-semibold text-slate-900">Log pengisian kuisioner Anda</h3>
      <ul class="mt-3 space-y-2 text-sm text-slate-700">
        <li
          v-for="item in attemptHistory"
          :key="`${item.id}-${item.attemptNumber}`"
          class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
        >
          <span class="font-semibold">Pengisian ke-{{ item.attemptNumber || '?' }}</span>
          <span class="text-xs text-slate-600">
            {{ item.createdAt ? new Date(item.createdAt).toLocaleString('id-ID') : '-' }}
          </span>
        </li>
      </ul>
    </div>

    <div
      v-if="showNimModal"
      class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Cari NIM</p>
            <h3 class="text-lg font-semibold text-slate-900">Cari NIM berdasarkan nama & tanggal lahir</h3>
          </div>
          <button
            type="button"
            class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
            @click="closeNimModal"
          >
            Tutup
          </button>
        </div>

        <div class="mt-4 space-y-3 text-sm text-slate-700">
          <div>
            <label class="text-xs font-semibold text-slate-600">Nama</label>
            <input
              v-model="searchName"
              type="text"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Contoh: Laila"
              required
            />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600">Tanggal lahir (opsional)</label>
            <input
              v-model="searchDob"
              type="date"
              class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              required
            />
          </div>
          <button
            type="button"
            class="w-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white shadow"
            :disabled="searchLoading"
            :class="searchLoading ? 'opacity-70 cursor-not-allowed' : ''"
            @click="handleSearchNim"
          >
            {{ searchLoading ? 'Mencari...' : 'Cari' }}
          </button>

          <div v-if="searchResultNim" class="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2">
            <div>
              <p class="text-xs font-semibold text-indigo-700">NIM ditemukan</p>
              <p class="text-sm font-semibold text-slate-900">{{ searchResultNim }}</p>
            </div>
            <button
              type="button"
              class="rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm"
              @click="copyNim"
            >
              Copy
            </button>
          </div>

          <p v-if="searchMessage" class="text-xs font-semibold text-emerald-600">{{ searchMessage }}</p>
          <p v-if="searchError" class="text-xs font-semibold text-rose-600">{{ searchError }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
