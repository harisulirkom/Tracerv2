<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import AdminShell from '../components/AdminShell.vue'
import tracerService from '@/services/tracerService'

const form = reactive({
  text: '',
  target: 'alumni',
  type: 'text',
  optionsText: '',
  category: 'Umum',
})

const initialQuestions = [
  // Profil dasar alumni
  { id: 'alq-profil-1', text: 'Nama lengkap', target: 'alumni', category: 'Profil', statusGroup: 'umum', type: 'text' },
  { id: 'alq-profil-2', text: 'NIK', target: 'alumni', category: 'Profil', statusGroup: 'umum', type: 'text' },
  { id: 'alq-profil-3', text: 'Alamat', target: 'alumni', category: 'Profil', statusGroup: 'umum', type: 'text' },
  { id: 'alq-profil-4', text: 'No HP', target: 'alumni', category: 'Profil', statusGroup: 'umum', type: 'text' },
  { id: 'alq-profil-5', text: 'NIM', target: 'alumni', category: 'Profil', statusGroup: 'umum', type: 'text' },
  { id: 'alq-profil-6', text: 'Fakultas', target: 'alumni', category: 'Profil', statusGroup: 'umum', type: 'text' },
  { id: 'alq-profil-7', text: 'Program Studi', target: 'alumni', category: 'Profil', statusGroup: 'umum', type: 'text' },
  { id: 'alq-profil-8', text: 'Tahun Lulus', target: 'alumni', category: 'Profil', statusGroup: 'umum', type: 'text' },
  { id: 'alq-profil-9', text: 'Email', target: 'alumni', category: 'Profil', statusGroup: 'umum', type: 'text' },
  { id: 'alq-status-1', text: 'Status setelah lulus', target: 'alumni', category: 'Status', statusGroup: 'umum', type: 'select', options: ['Bekerja', 'Wirausaha', 'Melanjutkan pendidikan', 'Mencari kerja', 'Belum memungkinkan bekerja'] },
  { id: 'alq-status-2', text: 'Masukan singkat untuk kampus/CDC', target: 'alumni', category: 'Masukan', statusGroup: 'umum', type: 'textarea' },

  // Bekerja
  { id: 'alq-bekerja-1', text: 'Mulai mencari kerja (bulan sebelum lulus)', target: 'alumni', category: 'Pencarian kerja', statusGroup: 'bekerja', type: 'number' },
  { id: 'alq-bekerja-2', text: 'Mulai mencari kerja (bulan setelah lulus)', target: 'alumni', category: 'Pencarian kerja', statusGroup: 'bekerja', type: 'number' },
  { id: 'alq-bekerja-3', text: 'Mendapat pekerjaan sebelum/≤6 bulan?', target: 'alumni', category: 'Pekerjaan pertama', statusGroup: 'bekerja', type: 'radio', options: ['Iya', 'Tidak'] },
  { id: 'alq-bekerja-4', text: 'Berapa bulan sampai mendapat pekerjaan', target: 'alumni', category: 'Pekerjaan pertama', statusGroup: 'bekerja', type: 'number' },
  { id: 'alq-bekerja-5', text: 'Pendapatan per bulan', target: 'alumni', category: 'Karier', statusGroup: 'bekerja', type: 'select', options: ['<1 juta', '1-3 juta', '3-5 juta', '>5 juta'] },
  { id: 'alq-bekerja-6', text: 'Tingkat tempat kerja', target: 'alumni', category: 'Karier', statusGroup: 'bekerja', type: 'select', options: ['Lokal', 'Nasional', 'Multinasional', 'Lainnya'] },
  { id: 'alq-bekerja-7', text: 'Lokasi bekerja (provinsi/kabupaten)', target: 'alumni', category: 'Lokasi', statusGroup: 'bekerja', type: 'text' },
  { id: 'alq-bekerja-8', text: 'Jenis perusahaan/instansi', target: 'alumni', category: 'Karier', statusGroup: 'bekerja', type: 'select', options: ['Instansi pemerintah', 'BUMN/BUMD', 'Organisasi multilateral', 'LSM', 'Perusahaan swasta', 'Wiraswasta', 'Lembaga/ Yayasan', 'Lainnya'] },
  { id: 'alq-bekerja-9', text: 'Nama perusahaan dan pimpinan', target: 'alumni', category: 'Karier', statusGroup: 'bekerja', type: 'text' },
  { id: 'alq-bekerja-10', text: 'Kontak perusahaan/pimpinan', target: 'alumni', category: 'Karier', statusGroup: 'bekerja', type: 'text' },
  { id: 'alq-bekerja-11', text: 'Cara mencari pekerjaan (multi)', target: 'alumni', category: 'Pencarian kerja', statusGroup: 'bekerja', type: 'checkbox' },
  { id: 'alq-bekerja-12', text: 'Jumlah perusahaan dilamar/respon/wawancara', target: 'alumni', category: 'Pencarian kerja', statusGroup: 'bekerja', type: 'text' },
  { id: 'alq-bekerja-13', text: 'Posisi/Jabatan dan kesesuaian bidang', target: 'alumni', category: 'Karier', statusGroup: 'bekerja', type: 'text' },
  { id: 'alq-bekerja-14', text: 'Kesesuaian pendidikan dengan pekerjaan', target: 'alumni', category: 'Karier', statusGroup: 'bekerja', type: 'select', options: ['Sangat sesuai', 'Sesuai', 'Cukup sesuai', 'Kurang sesuai'] },

  // Wirausaha
  { id: 'alq-wira-1', text: 'Nama dan kontak usaha', target: 'alumni', category: 'Wirausaha', statusGroup: 'wiraswasta', type: 'text' },
  { id: 'alq-wira-2', text: 'Bidang dan jenis usaha', target: 'alumni', category: 'Wirausaha', statusGroup: 'wiraswasta', type: 'text' },
  { id: 'alq-wira-3', text: 'Tingkat usaha (lokal/nasional)', target: 'alumni', category: 'Wirausaha', statusGroup: 'wiraswasta', type: 'select', options: ['Lokal', 'Nasional', 'Internasional'] },
  { id: 'alq-wira-4', text: 'Kesesuaian usaha dengan pendidikan', target: 'alumni', category: 'Wirausaha', statusGroup: 'wiraswasta', type: 'select', options: ['Sangat sesuai', 'Sesuai', 'Cukup sesuai', 'Kurang sesuai'] },

  // Studi lanjut
  { id: 'alq-studi-1', text: 'Lokasi studi lanjut (DN/LN)', target: 'alumni', category: 'Studi lanjut', statusGroup: 'melanjutkan', type: 'select', options: ['Dalam negeri', 'Luar negeri'] },
  { id: 'alq-studi-2', text: 'Sumber biaya studi', target: 'alumni', category: 'Studi lanjut', statusGroup: 'melanjutkan', type: 'select', options: ['Biaya sendiri', 'Beasiswa', 'Lainnya'] },
  { id: 'alq-studi-3', text: 'Nama PT dan prodi tujuan', target: 'alumni', category: 'Studi lanjut', statusGroup: 'melanjutkan', type: 'text' },
  { id: 'alq-studi-4', text: 'Tanggal masuk studi lanjut', target: 'alumni', category: 'Studi lanjut', statusGroup: 'melanjutkan', type: 'date' },
  { id: 'alq-studi-5', text: 'Alasan melanjutkan studi', target: 'alumni', category: 'Studi lanjut', statusGroup: 'melanjutkan', type: 'select', options: ['Tuntutan profesi', 'Beasiswa', 'Prestise', 'Belum ingin bekerja', 'Lainnya'] },

  // Mencari kerja
  { id: 'alq-cari-1', text: 'Mulai mencari kerja (bulan sebelum lulus)', target: 'alumni', category: 'Pencarian kerja', statusGroup: 'mencari', type: 'number' },
  { id: 'alq-cari-2', text: 'Mulai mencari kerja (bulan setelah lulus)', target: 'alumni', category: 'Pencarian kerja', statusGroup: 'mencari', type: 'number' },
  { id: 'alq-cari-3', text: 'Cara mencari kerja (multi)', target: 'alumni', category: 'Pencarian kerja', statusGroup: 'mencari', type: 'checkbox' },
  { id: 'alq-cari-4', text: 'Jumlah lamaran/respon/wawancara', target: 'alumni', category: 'Pencarian kerja', statusGroup: 'mencari', type: 'text' },
  { id: 'alq-cari-5', text: 'Aktif mencari 4 minggu terakhir?', target: 'alumni', category: 'Pencarian kerja', statusGroup: 'mencari', type: 'select', options: ['Tidak', 'Tidak, menunggu hasil', 'Ya, akan mulai bekerja 2 minggu', 'Lainnya'] },

  // Kompetensi & pembelajaran (ringkas)
  { id: 'alq-komp-1', text: 'Penilaian kompetensi individu (Etika, Keahlian, Bahasa, TI, Komunikasi, Kerjasama, Pengembangan)', target: 'alumni', category: 'Kompetensi', statusGroup: 'umum', type: 'radio' },
  { id: 'alq-komp-2', text: 'Penilaian kompetensi pembelajaran (Perkuliahan, Demonstrasi, Riset, Magang, Praktikum, Kerja lapangan, Diskusi)', target: 'alumni', category: 'Kompetensi', statusGroup: 'umum', type: 'radio' },
  { id: 'alq-fund-1', text: 'Sumber dana pembiayaan kuliah', target: 'alumni', category: 'Pendanaan', statusGroup: 'umum', type: 'select', options: ['Biaya sendiri/keluarga', 'Beasiswa ADik', 'Beasiswa KIP-K', 'Beasiswa PPA', 'Beasiswa Afirmasi', 'Beasiswa perusahaan/swasta', 'Lainnya'] },

  // Pengguna alumni (profil organisasi)
  { id: 'pg-profil-1', text: 'Nama perusahaan/instansi', target: 'pengguna', category: 'Profil organisasi', statusGroup: 'pengguna', type: 'text' },
  { id: 'pg-profil-2', text: 'Bidang industri', target: 'pengguna', category: 'Profil organisasi', statusGroup: 'pengguna', type: 'text' },
  { id: 'pg-profil-3', text: 'Nama PIC & jabatan', target: 'pengguna', category: 'Profil organisasi', statusGroup: 'pengguna', type: 'text' },
  { id: 'pg-profil-4', text: 'Kontak (email/telepon)', target: 'pengguna', category: 'Profil organisasi', statusGroup: 'pengguna', type: 'text' },
  { id: 'pg-profil-5', text: 'Kota/kabupaten', target: 'pengguna', category: 'Profil organisasi', statusGroup: 'pengguna', type: 'text' },
  // Pengguna alumni (penilaian)
  { id: 'pg-penilaian-1', text: 'Kinerja alumni kami', target: 'pengguna', category: 'Penilaian', statusGroup: 'pengguna', type: 'textarea' },
  { id: 'pg-penilaian-2', text: 'Kompetensi paling menonjol', target: 'pengguna', category: 'Penilaian', statusGroup: 'pengguna', type: 'textarea' },
  { id: 'pg-penilaian-3', text: 'Area pengembangan yang diharapkan', target: 'pengguna', category: 'Penilaian', statusGroup: 'pengguna', type: 'textarea' },
  // Pengguna alumni (kebutuhan)
  { id: 'pg-kebutuhan-1', text: 'Jumlah alumni yang direkrut', target: 'pengguna', category: 'Kebutuhan rekrutmen', statusGroup: 'pengguna', type: 'text' },
  { id: 'pg-kebutuhan-2', text: 'Peran atau divisi yang dibutuhkan', target: 'pengguna', category: 'Kebutuhan rekrutmen', statusGroup: 'pengguna', type: 'text' },
  { id: 'pg-kebutuhan-3', text: 'Waktu kebutuhan tenaga kerja', target: 'pengguna', category: 'Kebutuhan rekrutmen', statusGroup: 'pengguna', type: 'text' },
  { id: 'pg-lain-1', text: 'Catatan tambahan/masukan untuk kampus', target: 'pengguna', category: 'Masukan', statusGroup: 'pengguna', type: 'textarea' },
]

const questions = ref([...initialQuestions])
const loading = ref(false)
const loadError = ref('')
const searchQuery = ref('')
const filterTarget = ref('all')
const filterType = ref('all')
const filterStatusGroup = ref('all')
const editingId = ref(null)
const message = ref('')

const statusGroups = [
  { value: 'all', label: 'Semua status' },
  { value: 'umum', label: 'Umum' },
  { value: 'bekerja', label: 'Bekerja' },
  { value: 'wiraswasta', label: 'Wirausaha' },
  { value: 'melanjutkan', label: 'Studi lanjut' },
  { value: 'mencari', label: 'Mencari kerja' },
  { value: 'pengguna', label: 'Pengguna alumni' },
]

const filteredQuestions = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return questions.value.filter((item) => {
    const matchSearch = item.text.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    const matchTarget = filterTarget.value === 'all' || item.target === filterTarget.value
    const matchType = filterType.value === 'all' || item.type === filterType.value
    const matchStatus = filterStatusGroup.value === 'all' || item.statusGroup === filterStatusGroup.value
    return matchSearch && matchTarget && matchType && matchStatus
  })
})

const stats = computed(() => {
  const total = questions.value.length
  const alumni = questions.value.filter((q) => q.target === 'alumni').length
  const pengguna = questions.value.filter((q) => q.target === 'pengguna').length
  const umum = questions.value.filter((q) => q.target === 'umum').length
  return { total, alumni, pengguna, umum }
})

const resetForm = () => {
  form.text = ''
  form.target = 'alumni'
  form.type = 'text'
  form.optionsText = ''
  form.category = 'Umum'
  form.statusGroup = 'umum'
  editingId.value = null
}

const handleSubmit = async () => {
  if (!form.text.trim()) {
    message.value = 'Teks pertanyaan wajib diisi.'
    return
  }

  const options = ['select', 'radio', 'checkbox'].includes(form.type)
    ? form.optionsText
        .split('\n')
        .map((opt) => opt.trim())
        .filter(Boolean)
    : []

  try {
    if (editingId.value) {
      const payload = {
        text: form.text,
        target: form.target,
        type: form.type,
        options,
        category: form.category,
        statusGroup: form.statusGroup,
      }
      await tracerService.updateQuestionBankItem(editingId.value, payload)
      questions.value = questions.value.map((item) =>
        item.id === editingId.value ? { ...item, ...payload } : item,
      )
      message.value = 'Pertanyaan diperbarui.'
    } else {
      const newItem = {
        id: `q-${Date.now()}`,
        text: form.text,
        target: form.target,
        type: form.type,
        options,
        category: form.category,
        statusGroup: form.statusGroup,
      }
      try {
        const resp = await tracerService.createQuestionBankItem(newItem)
        const saved = resp?.data || resp
        if (saved?.id) newItem.id = saved.id
      } catch (err) {
        // jika API gagal, gunakan ID lokal
      }
      questions.value.unshift(newItem)
      message.value = 'Pertanyaan ditambahkan.'
    }
    resetForm()
  } catch (err) {
    message.value = err?.message || 'Gagal menyimpan pertanyaan.'
  }
}

const handleEdit = (item) => {
  editingId.value = item.id
  form.text = item.text
  form.target = item.target
  form.type = item.type
  form.category = item.category
  form.optionsText = item.options?.join('\n') || ''
  form.statusGroup = item.statusGroup || 'umum'
}

const handleDelete = async (id) => {
  try {
    await tracerService.deleteQuestionBankItem(id)
    questions.value = questions.value.filter((item) => item.id !== id)
  } catch (err) {
    message.value = err?.message || 'Gagal menghapus pertanyaan.'
  }
}

const loadQuestions = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const resp = await tracerService.getQuestionBank()
    const list = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : []
    if (list.length) {
      questions.value = list
      return
    }
    questions.value = [...initialQuestions]
  } catch (err) {
    loadError.value = err?.message || 'Gagal memuat bank soal, menggunakan data lokal.'
    questions.value = [...initialQuestions]
  } finally {
    loading.value = false
  }
}

onMounted(loadQuestions)
</script>

<template>
  <AdminShell>
    <template #default>
      <div class="flex flex-col gap-8">
        <header class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Bank Soal</p>
            <h1 class="text-3xl font-semibold text-slate-900">Kelola pertanyaan kuisioner</h1>
            <p class="text-sm text-slate-600">
              Mengakomodasi pertanyaan kuisioner alumni dan pengguna dalam satu tempat (CRUD).
            </p>
          </div>
          <div class="flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
            <span class="rounded-full bg-indigo-50 px-3 py-1">Total: {{ stats.total }}</span>
            <span class="rounded-full bg-emerald-50 px-3 py-1">Alumni: {{ stats.alumni }}</span>
            <span class="rounded-full bg-sky-50 px-3 py-1">Pengguna: {{ stats.pengguna }}</span>
            <span class="rounded-full bg-slate-100 px-3 py-1">Umum: {{ stats.umum }}</span>
          </div>
        </header>

        <div v-if="loadError" class="rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          {{ loadError }}
        </div>
        <div v-if="loading" class="rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">
          Memuat bank soal...
        </div>

        <div class="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-3">
          <div class="lg:col-span-1 space-y-3">
            <p class="text-sm font-semibold text-slate-900">
              {{ editingId ? 'Edit pertanyaan' : 'Tambah pertanyaan' }}
            </p>
            <label class="text-sm font-semibold text-slate-900">Pertanyaan</label>
            <textarea
              v-model="form.text"
              rows="3"
          class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none"
          placeholder="Tulis pertanyaan..."
        />
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
                <label class="text-sm font-semibold text-slate-900">Untuk</label>
                <select
                  v-model="form.target"
                  class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none"
            >
              <option value="alumni">Alumni</option>
              <option value="pengguna">Pengguna alumni</option>
              <option value="umum">Umum</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-semibold text-slate-900">Status/Kelompok</label>
            <select
              v-model="form.statusGroup"
              class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none"
            >
              <option value="umum">Umum</option>
              <option value="bekerja">Bekerja</option>
              <option value="wiraswasta">Wirausaha</option>
              <option value="melanjutkan">Studi lanjut</option>
              <option value="mencari">Mencari kerja</option>
              <option value="pengguna">Pengguna alumni</option>
            </select>
          </div>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label class="text-sm font-semibold text-slate-900">Tipe</label>
            <select
              v-model="form.type"
              class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none"
            >
                  <option value="text">Jawaban singkat</option>
                  <option value="textarea">Paragraf</option>
                  <option value="select">Pilihan ganda</option>
              <option value="radio">Radio</option>
              <option value="checkbox">Checkbox</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-semibold text-slate-900">Kategori</label>
            <input
              v-model="form.category"
              type="text"
              class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none"
              placeholder="Karier, Kompetensi, Kepuasan..."
            />
          </div>
        </div>
        <div v-if="['select', 'radio', 'checkbox'].includes(form.type)">
          <label class="text-sm font-semibold text-slate-900">Opsi (pisah baris)</label>
          <textarea
            v-model="form.optionsText"
            rows="3"
                class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none"
                placeholder="Contoh: Sangat setuju\nSetuju\nNetral\nTidak setuju"
              />
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
                @click="handleSubmit"
              >
                {{ editingId ? 'Perbarui' : 'Tambah' }} Pertanyaan
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                @click="resetForm"
              >
                Reset
              </button>
            </div>
            <p v-if="message" class="text-xs font-semibold text-emerald-600">{{ message }}</p>
      </div>

      <div class="lg:col-span-2 space-y-4">
        <div class="grid gap-3 sm:grid-cols-4">
          <input
            v-model="searchQuery"
            type="text"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none"
            placeholder="Cari pertanyaan..."
              />
              <select
                v-model="filterTarget"
                class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none"
              >
                <option value="all">Semua target</option>
                <option value="alumni">Alumni</option>
                <option value="pengguna">Pengguna alumni</option>
                <option value="umum">Umum</option>
              </select>
              <select
                v-model="filterType"
                class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none"
              >
                <option value="all">Semua tipe</option>
                <option value="text">Jawaban singkat</option>
                <option value="textarea">Paragraf</option>
                <option value="select">Pilihan ganda</option>
              <option value="radio">Radio</option>
              <option value="checkbox">Checkbox</option>
            </select>
          <select
            v-model="filterStatusGroup"
            class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none"
          >
            <option v-for="opt in statusGroups" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="space-y-3">
          <div
            v-for="item in filteredQuestions"
                :key="item.id"
                class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div class="space-y-1">
                    <div class="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      <span class="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">{{ item.category }}</span>
                      <span
                        class="rounded-full px-2 py-1 text-[11px] font-semibold"
                        :class="{
                          'bg-emerald-50 text-emerald-700': item.target === 'alumni',
                          'bg-sky-50 text-sky-700': item.target === 'pengguna',
                          'bg-slate-100 text-slate-700': item.target === 'umum',
                        }"
                      >
                        {{ item.target === 'pengguna' ? 'Pengguna alumni' : item.target }}
                      </span>
                      <span class="rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700">{{ item.type }}</span>
                      <span
                        v-if="item.statusGroup"
                        class="rounded-full bg-orange-50 px-2 py-1 text-[11px] font-semibold text-amber-700 capitalize"
                      >
                        {{ item.statusGroup.replace('-', ' ') }}
                      </span>
                    </div>
                    <p class="text-sm font-semibold text-slate-900">{{ item.text }}</p>
                    <div v-if="item.options?.length" class="flex flex-wrap gap-2 text-xs text-slate-600">
                      <span v-for="opt in item.options" :key="opt" class="rounded-full bg-slate-100 px-2 py-1">
                        {{ opt }}
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      @click="handleEdit(item)"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      class="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                      @click="handleDelete(item.id)"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
              <p v-if="!filteredQuestions.length" class="text-sm text-slate-500">Belum ada pertanyaan yang cocok.</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </AdminShell>
</template>
