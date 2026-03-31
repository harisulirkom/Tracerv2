<script setup>
import { computed, reactive, ref, onMounted, watch } from 'vue'
import AdminShell from '../components/AdminShell.vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import tracerService from '@/services/tracerService'
import { useAuth } from '../stores/auth'
import { useUserManagement } from '../stores/userManagement'

const auth = useAuth()
const { accessControl } = useUserManagement()
const isFacultyAdmin = computed(
  () => (auth.user.value?.role || '').toLowerCase() === 'admin fakultas',
)
const isProdiAdmin = computed(
  () => (auth.user.value?.role || '').toLowerCase() === 'admin prodi',
)
const bankSoalReadOnly = computed(
  () =>
    (isFacultyAdmin.value || isProdiAdmin.value) &&
    (accessControl.value?.restrictFacultyBankSoalWrite ?? true),
)

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
  { id: 'alq-bekerja-3', text: 'Apakah Anda telah mendapatkan pekerjaan ≤6 bulan/termasuk sebelum lulus?', target: 'alumni', category: 'Pekerjaan pertama', statusGroup: 'bekerja', type: 'radio', options: ['Iya', 'Tidak'] },
  { id: 'alq-bekerja-4', text: 'Berapa bulan sampai mendapat pekerjaan?', target: 'alumni', category: 'Pekerjaan pertama', statusGroup: 'bekerja', type: 'number' },
  { id: 'alq-bekerja-5', text: 'Pendapatan per bulan', target: 'alumni', category: 'Karier', statusGroup: 'bekerja', type: 'select', options: ['<1 juta', '1-3 juta', '3-5 juta', '>5 juta'] },
  { id: 'alq-bekerja-6', text: 'Tingkat tempat kerja', target: 'alumni', category: 'Karier', statusGroup: 'bekerja', type: 'select', options: ['Lokal/wilayah/wiraswasta tidak berbadan hukum', 'Nasional/wiraswasta berbadan hukum', 'Multinasional/internasional', 'Lainnya'] },
  { id: 'alq-bekerja-7', text: 'Lokasi tempat bekerja (Provinsi)', target: 'alumni', category: 'Lokasi', statusGroup: 'bekerja', type: 'text' },
  { id: 'alq-bekerja-7-1', text: 'Lokasi tempat bekerja (Kabupaten/Kota)', target: 'alumni', category: 'Lokasi', statusGroup: 'bekerja', type: 'text' },
  { id: 'alq-bekerja-8', text: 'Jenis perusahaan/instansi', target: 'alumni', category: 'Karier', statusGroup: 'bekerja', type: 'select', options: ['Instansi Pemerintah', 'BUMN / BUMD', 'Institusi / Organisasi Multilateral', 'Organisasi Non-profit / LSM', 'Perusahaan Swasta', 'Wiraswasta / Perusahaan Sendiri', 'Lembaga / Yayasan', 'Lainnya'] },
  { id: 'alq-bekerja-9', text: 'Nama perusahaan/kantor', target: 'alumni', category: 'Karier', statusGroup: 'bekerja', type: 'text' },
  { id: 'alq-bekerja-9-1', text: 'Nama pimpinan', target: 'alumni', category: 'Karier', statusGroup: 'bekerja', type: 'text' },
  { id: 'alq-bekerja-10', text: 'Nomor telepon/HP perusahaan/pimpinan', target: 'alumni', category: 'Karier', statusGroup: 'bekerja', type: 'text' },
  { id: 'alq-bekerja-11', text: 'Cara mencari pekerjaan', target: 'alumni', category: 'Pencarian kerja', statusGroup: 'bekerja', type: 'checkbox', options: ['Melalui iklan di koran/majalah, brosur', 'Melamar ke perusahaan tanpa mengetaui lowongan yang ada', 'Pergi ke bursa/pameran kerja', 'Mencari lewat internet/iklan online/milis', 'Dihubungi oleh perusahaan', 'Menghubungi Kemenakertrans', 'Menghubungi agen tenaga kerja komersial/swasta', 'Memperoleh informasi dari pusat pengembangan karir fakultas/universitas', 'Menghubungi kantor kemahasiswaan/hubungan alumni', 'Membangun jejaring (network) sejak masih kuliah', 'Melalui relasi (misalnya dosen, orang tua, saudara, teman, dll)', 'Membangun bisnis sendiri', 'Melalui penempatan kerja atau magang', 'Bekerja di tempat yang sama dengan tempat kerja semasa kuliah', 'Lainnya'] },
  { id: 'alq-bekerja-12-1', text: 'Berapa perusahaan yang Anda lamar sebelum memperoleh pekerjaan?', target: 'alumni', category: 'Pencarian kerja', statusGroup: 'bekerja', type: 'number' },
  { id: 'alq-bekerja-12-2', text: 'Berapa perusahaan yang merespons lamaran Anda?', target: 'alumni', category: 'Pencarian kerja', statusGroup: 'bekerja', type: 'number' },
  { id: 'alq-bekerja-12-3', text: 'Berapa perusahaan yang mengundang Anda wawancara?', target: 'alumni', category: 'Pencarian kerja', statusGroup: 'bekerja', type: 'number' },
  { id: 'alq-bekerja-13-1', text: 'Jika pekerjaan tidak sesuai pendidikan, mengapa diambil?', target: 'alumni', category: 'Karier', statusGroup: 'bekerja', type: 'checkbox', options: ['Saya belum mendapatkan pekerjaan yang lebih sesuai dengan pendidikan saya', 'Di pekerjaan ini saya memperoleh prospek karir yang baik', 'Saya lebih suka bekerja di area pekerjaan yang tidak ada hubungannya dengan pendidikan saya', 'Saya dipromosikan ke posisi yang kurang berhubungan dengan pendidikan saya dibanding posisi sebelumnya', 'Saya dapat memperoleh pendapatan yang lebih tinggi di pekerjaan ini', 'Pekerjaan saya saat ini lebih aman/terjamin/secure', 'Pekerjaan saya saat ini lebih menarik', 'Pekerjaan saya saat ini lebih memungkinkan saya mengambil pekerjaan tambahan/jadwal yang fleksibel, dll', 'Pekerjaan saya saat ini lokasinya lebih dekat dari rumah saya', 'Pekerjaan saya saat ini dpt lebih menjamin kebutuhan keluarga', 'Pada awal meniti karir ini, saya harus menerima pekerjaan yang tidak berhubungan dengan pendidikan saya', 'Lainnya'] },
  { id: 'alq-bekerja-13-2', text: 'Posisi/Jabatan saat ini', target: 'alumni', category: 'Karier', statusGroup: 'bekerja', type: 'select', options: ['Founder', 'Co-Founder', 'Staff', 'Freelance/Kerja Lepas', 'Lainnya'] },
  { id: 'alq-bekerja-14-1', text: 'Seberapa erat hubungan bidang studi dengan pekerjaan Anda?', target: 'alumni', category: 'Karier', statusGroup: 'bekerja', type: 'select', options: ['Sangat erat', 'Erat', 'Cukup erat', 'Kurang erat', 'Tidak sama sekali', 'Lainnya'] },
  { id: 'alq-bekerja-14-2', text: 'Tingkat pendidikan paling sesuai untuk pekerjaan Anda?', target: 'alumni', category: 'Karier', statusGroup: 'bekerja', type: 'select', options: ['Setingkat Lebih Tinggi', 'Tingkat yang Sama', 'Setingkat Lebih Rendah', 'Tidak Perlu Pendidikan tinggi'] },

  // Wirausaha
  { id: 'alq-wira-1', text: 'Nama perusahaan/kantor tempat berwiraswasta', target: 'alumni', category: 'Wirausaha', statusGroup: 'wiraswasta', type: 'text' },
  { id: 'alq-wira-2', text: 'Nomor telepon/HP perusahaan/pimpinan (Wira)', target: 'alumni', category: 'Wirausaha', statusGroup: 'wiraswasta', type: 'text' },
  { id: 'alq-wira-3', text: 'Jenis perusahaan tempat berwiraswasta', target: 'alumni', category: 'Wirausaha', statusGroup: 'wiraswasta', type: 'select', options: ['Institusi/Organisasi Multilateral', 'Organisasi non-profit/LSM', 'Perusahaan swasta', 'Wiraswasta/perusahaan sendiri', 'Lembaga/Yayasan', 'Lainnya'] },
  { id: 'alq-wira-4', text: 'Bidang/sektor wiraswasta', target: 'alumni', category: 'Wirausaha', statusGroup: 'wiraswasta', type: 'text' },
  { id: 'alq-wira-5', text: 'Tingkat tempat kerja (Wira)', target: 'alumni', category: 'Wirausaha', statusGroup: 'wiraswasta', type: 'select', options: ['Lokal/wilayah/wiraswasta tidak berbadan hukum', 'Nasional/wiraswasta berbadan hukum', 'Multinasional/internasional', 'Lainnya'] },
  { id: 'alq-wira-6', text: 'Kesesuaian bidang studi dengan usaha', target: 'alumni', category: 'Wirausaha', statusGroup: 'wiraswasta', type: 'select', options: ['Sangat Erat', 'Erat', 'Cukup Erat', 'Kurang Erat', 'Tidak Sama Sekali', 'Lainnya'] },
  { id: 'alq-wira-7', text: 'Tingkat pendidikan paling sesuai (Wira)', target: 'alumni', category: 'Wirausaha', statusGroup: 'wiraswasta', type: 'select', options: ['Setingkat Lebih Tinggi', 'Tingkat yang Sama', 'Setingkat Lebih Rendah', 'Tidak Perlu Pendidikan Tinggi', 'Lainnya'] },

  // Studi lanjut
  { id: 'alq-studi-1', text: 'Lokasi studi lanjut', target: 'alumni', category: 'Studi lanjut', statusGroup: 'melanjutkan', type: 'select', options: ['Dalam Negeri', 'Luar Negeri'] },
  { id: 'alq-studi-2', text: 'Sumber biaya studi lanjut', target: 'alumni', category: 'Studi lanjut', statusGroup: 'melanjutkan', type: 'select', options: ['Biaya Sendiri', 'Beasiswa', 'Lainnya'] },
  { id: 'alq-studi-3', text: 'Nama Perguruan Tinggi (Lanjut)', target: 'alumni', category: 'Studi lanjut', statusGroup: 'melanjutkan', type: 'text' },
  { id: 'alq-studi-4', text: 'Program Studi (Lanjut)', target: 'alumni', category: 'Studi lanjut', statusGroup: 'melanjutkan', type: 'text' },
  { id: 'alq-studi-5', text: 'Tanggal/Tahun Masuk (Lanjut)', target: 'alumni', category: 'Studi lanjut', statusGroup: 'melanjutkan', type: 'date' },
  { id: 'alq-studi-6', text: 'Alasan melanjutkan studi', target: 'alumni', category: 'Studi lanjut', statusGroup: 'melanjutkan', type: 'select', options: ['Tuntutan profesi', 'Kesempatan beasiswa', 'Prestise', 'Belum ada keinginan untuk bekerja', 'Lainnya'] },

  // Mencari kerja
  { id: 'alq-cari-1', text: 'Mulai mencari pekerjaan (bulan sebelum lulus)', target: 'alumni', category: 'Pencarian kerja', statusGroup: 'mencari', type: 'number' },
  { id: 'alq-cari-2', text: 'Mulai mencari pekerjaan (bulan setelah lulus)', target: 'alumni', category: 'Pencarian kerja', statusGroup: 'mencari', type: 'number' },
  { id: 'alq-cari-3', text: 'Cara Anda mencari pekerjaan', target: 'alumni', category: 'Pencarian kerja', statusGroup: 'mencari', type: 'checkbox', options: ['Melalui iklan di koran/majalah, brosur', 'Melamar ke perusahaan tanpa mengetaui lowongan yang ada', 'Pergi ke bursa/pameran kerja', 'Mencari lewat internet/iklan online/milis', 'Dihubungi oleh perusahaan', 'Menghubungi Kemenakertrans', 'Menghubungi agen tenaga kerja komersial/swasta', 'Memperoleh informasi dari pusat pengembangan karir fakultas/universitas', 'Menghubungi kantor kemahasiswaan/hubungan alumni', 'Membangun jejaring (network) sejak masih kuliah', 'Melalui relasi (misalnya dosen, orang tua, saudara, teman, dll)', 'Membangun bisnis sendiri', 'Melalui penempatan kerja atau magang', 'Bekerja di tempat yang sama dengan tempat kerja semasa kuliah', 'Lainnya'] },
  { id: 'alq-cari-4-1', text: 'Berapa perusahaan yang Anda lamar', target: 'alumni', category: 'Pencarian kerja', statusGroup: 'mencari', type: 'number' },
  { id: 'alq-cari-4-2', text: 'Berapa perusahaan yang merespons', target: 'alumni', category: 'Pencarian kerja', statusGroup: 'mencari', type: 'number' },
  { id: 'alq-cari-4-3', text: 'Berapa perusahaan yang mengundang wawancara', target: 'alumni', category: 'Pencarian kerja', statusGroup: 'mencari', type: 'number' },
  { id: 'alq-cari-5', text: 'Apakah Anda aktif mencari pekerjaan dalam 4 minggu terakhir?', target: 'alumni', category: 'Pencarian kerja', statusGroup: 'mencari', type: 'select', options: ['Tidak', 'Tidak, tapi saya sedang menunggu hasil lamaran kerja', 'Ya, saya akan mulai bekerja dalam 2 minggu ke depan', 'Lainnya'] },

  // Kompetensi
  { id: 'alq-komp-1-1', text: 'Penilaian kompetensi individu: Etika', target: 'alumni', category: 'Kompetensi', statusGroup: 'umum', type: 'radio', options: ['1', '2', '3', '4', '5'] },
  { id: 'alq-komp-1-2', text: 'Penilaian kompetensi individu: Keahlian berdasarkan bidang', target: 'alumni', category: 'Kompetensi', statusGroup: 'umum', type: 'radio', options: ['1', '2', '3', '4', '5'] },
  { id: 'alq-komp-1-3', text: 'Penilaian kompetensi individu: Bahasa Inggris', target: 'alumni', category: 'Kompetensi', statusGroup: 'umum', type: 'radio', options: ['1', '2', '3', '4', '5'] },
  { id: 'alq-komp-1-4', text: 'Penilaian kompetensi individu: Penggunaan Teknologi Informasi', target: 'alumni', category: 'Kompetensi', statusGroup: 'umum', type: 'radio', options: ['1', '2', '3', '4', '5'] },
  { id: 'alq-komp-1-5', text: 'Penilaian kompetensi individu: Komunikasi', target: 'alumni', category: 'Kompetensi', statusGroup: 'umum', type: 'radio', options: ['1', '2', '3', '4', '5'] },
  { id: 'alq-komp-1-6', text: 'Penilaian kompetensi individu: Kerjasama tim', target: 'alumni', category: 'Kompetensi', statusGroup: 'umum', type: 'radio', options: ['1', '2', '3', '4', '5'] },
  { id: 'alq-komp-1-7', text: 'Penilaian kompetensi individu: Pengembangan diri', target: 'alumni', category: 'Kompetensi', statusGroup: 'umum', type: 'radio', options: ['1', '2', '3', '4', '5'] },

  { id: 'alq-komp-2-1', text: 'Penilaian kompetensi pembelajaran: Perkuliahan', target: 'alumni', category: 'Kompetensi', statusGroup: 'umum', type: 'radio', options: ['1', '2', '3', '4', '5'] },
  { id: 'alq-komp-2-2', text: 'Penilaian kompetensi pembelajaran: Demonstrasi', target: 'alumni', category: 'Kompetensi', statusGroup: 'umum', type: 'radio', options: ['1', '2', '3', '4', '5'] },
  { id: 'alq-komp-2-3', text: 'Penilaian kompetensi pembelajaran: Proyek riset', target: 'alumni', category: 'Kompetensi', statusGroup: 'umum', type: 'radio', options: ['1', '2', '3', '4', '5'] },
  { id: 'alq-komp-2-4', text: 'Penilaian kompetensi pembelajaran: Magang', target: 'alumni', category: 'Kompetensi', statusGroup: 'umum', type: 'radio', options: ['1', '2', '3', '4', '5'] },
  { id: 'alq-komp-2-5', text: 'Penilaian kompetensi pembelajaran: Praktikum', target: 'alumni', category: 'Kompetensi', statusGroup: 'umum', type: 'radio', options: ['1', '2', '3', '4', '5'] },
  { id: 'alq-komp-2-6', text: 'Penilaian kompetensi pembelajaran: Kerja lapangan', target: 'alumni', category: 'Kompetensi', statusGroup: 'umum', type: 'radio', options: ['1', '2', '3', '4', '5'] },
  { id: 'alq-komp-2-7', text: 'Penilaian kompetensi pembelajaran: Diskusi', target: 'alumni', category: 'Kompetensi', statusGroup: 'umum', type: 'radio', options: ['1', '2', '3', '4', '5'] },

  { id: 'alq-fund-1', text: 'Sumber dana pembiayaan kuliah', target: 'alumni', category: 'Pendanaan', statusGroup: 'umum', type: 'select', options: ['Biaya Sendiri/Keluarga', 'Beasiswa ADik', 'Beasiswa KIP-K/Bidikmisi', 'Beasiswa PPA', 'Beasiswa AFIRMASI', 'Beasiswa Perusahaan/Swasta', 'Lainnya'] },

  // Pengguna alumni (profil organisasi)
  { id: 'pg-profil-1', text: 'Nama perusahaan/instansi', target: 'pengguna', category: 'Profil organisasi', statusGroup: 'pengguna', type: 'text' },
  { id: 'pg-profil-1-1', text: 'Nama Alumni yang dinilai', target: 'pengguna', category: 'Profil organisasi', statusGroup: 'pengguna', type: 'text' },
  { id: 'pg-profil-2', text: 'Bidang industri', target: 'pengguna', category: 'Profil organisasi', statusGroup: 'pengguna', type: 'text' },
  { id: 'pg-profil-3', text: 'Nama PIC', target: 'pengguna', category: 'Profil organisasi', statusGroup: 'pengguna', type: 'text' },
  { id: 'pg-profil-3-1', text: 'Jabatan PIC', target: 'pengguna', category: 'Profil organisasi', statusGroup: 'pengguna', type: 'text' },
  { id: 'pg-profil-4', text: 'Email / No. kontak', target: 'pengguna', category: 'Profil organisasi', statusGroup: 'pengguna', type: 'text' },
  { id: 'pg-profil-5', text: 'Kota/kabupaten', target: 'pengguna', category: 'Profil organisasi', statusGroup: 'pengguna', type: 'text' },
  // Pengguna alumni (penilaian)
  { id: 'pg-penilaian-1', text: 'Kinerja alumni kami', target: 'pengguna', category: 'Penilaian', statusGroup: 'pengguna', type: 'textarea' },
  { id: 'pg-penilaian-2', text: 'Kompetensi paling menonjol', target: 'pengguna', category: 'Penilaian', statusGroup: 'pengguna', type: 'textarea' },
  { id: 'pg-penilaian-3', text: 'Area pengembangan yang diharapkan', target: 'pengguna', category: 'Penilaian', statusGroup: 'pengguna', type: 'textarea' },
  // Pengguna alumni (kebutuhan)
  { id: 'pg-kebutuhan-1', text: 'Jumlah alumni yang direkrut', target: 'pengguna', category: 'Kebutuhan rekrutmen', statusGroup: 'pengguna', type: 'text' },
  { id: 'pg-kebutuhan-2', text: 'Peran atau divisi yang dibutuhkan', target: 'pengguna', category: 'Kebutuhan rekrutmen', statusGroup: 'pengguna', type: 'text' },
  { id: 'pg-kebutuhan-3', text: 'Waktu kebutuhan tenaga kerja', target: 'pengguna', category: 'Kebutuhan rekrutmen', statusGroup: 'pengguna', type: 'text' },
  { id: 'pg-lain-1', text: 'Catatan atau masukan tambahan', target: 'pengguna', category: 'Masukan', statusGroup: 'pengguna', type: 'textarea' },
]

const questions = ref([...initialQuestions])
const loading = ref(false)
const loadError = ref('')
const searchQuery = ref('')
const filterTarget = ref('all')
const filterType = ref('all')
const filterStatusGroup = ref('all')
const pageSizeOptions = [10, 20, 50, 100, 'all']
const pageSize = ref(10)
const currentPage = ref(1)
const editingId = ref(null)
const message = ref('')
const saving = ref(false)
const deleting = ref(false)
const confirmSaveOpen = ref(false)
const confirmDeleteOpen = ref(false)
const saveIntent = ref('form')
const pendingTemplateSave = ref(null)
const deleteTarget = ref(null)

const statusGroups = [
  { value: 'all', label: 'Semua status' },
  { value: 'umum', label: 'Umum' },
  { value: 'bekerja', label: 'Bekerja' },
  { value: 'wiraswasta', label: 'Wirausaha' },
  { value: 'melanjutkan', label: 'Studi lanjut' },
  { value: 'mencari', label: 'Mencari kerja' },
  { value: 'belum', label: 'Belum memungkinkan bekerja' },
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

const totalPages = computed(() => {
  if (pageSize.value === 'all') return 1
  return Math.max(1, Math.ceil(filteredQuestions.value.length / Number(pageSize.value || 1)))
})

const paginatedQuestions = computed(() => {
  if (pageSize.value === 'all') return filteredQuestions.value
  const size = Number(pageSize.value || 1)
  const start = (currentPage.value - 1) * size
  return filteredQuestions.value.slice(start, start + size)
})

const showingRange = computed(() => {
  const total = filteredQuestions.value.length
  if (!total) return { start: 0, end: 0, total: 0 }
  if (pageSize.value === 'all') return { start: 1, end: total, total }
  const size = Number(pageSize.value || 1)
  const start = (currentPage.value - 1) * size + 1
  const end = Math.min(total, start + size - 1)
  return { start, end, total }
})

watch([filteredQuestions, pageSize], () => {
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

const goPrev = () => {
  if (currentPage.value > 1) currentPage.value -= 1
}

const goNext = () => {
  if (currentPage.value < totalPages.value) currentPage.value += 1
}

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
  confirmSaveOpen.value = false
  saveIntent.value = 'form'
  pendingTemplateSave.value = null
}

// Helper: Check if question is from database (has numeric ID) vs template (string ID)
const isFromDatabase = (id) => {
  return typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id))
}

const mapFromApi = (item) => {
  const meta = item.metadata || {}
  const statusGroup = meta.statusGroup || meta.status_group || 'umum'
  const target = meta.target || 'alumni'
  const category = meta.category || 'Umum'
  return {
    id: item.id,
    text: item.pertanyaan || '',
    target,
    type: item.tipe || 'text',
    options: Array.isArray(item.pilihan) ? item.pilihan : [],
    category,
    statusGroup,
    raw: item,
  }
}

const mapToApi = (item) => ({
  pertanyaan: item.text,
  tipe: item.type,
  pilihan: Array.isArray(item.options) ? item.options : [],
  is_required: false,
  metadata: {
    target: item.target,
    statusGroup: item.statusGroup,
    category: item.category,
  },
})

const handleSubmit = async () => {
  if (saving.value) return
  if (bankSoalReadOnly.value) {
    message.value = 'Mode hanya baca. Admin fakultas tidak dapat mengubah bank soal.'
    return
  }
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

  saving.value = true
  try {
    if (editingId.value) {
      const payload = mapToApi({
        id: editingId.value,
        text: form.text,
        target: form.target,
        type: form.type,
        options,
        category: form.category,
        statusGroup: form.statusGroup,
      })
      const resp = await tracerService.updateQuestionBankItem(editingId.value, payload)
      const updated = resp?.data ? mapFromApi(resp.data) : mapFromApi({ id: editingId.value, ...payload })
      questions.value = questions.value.map((item) => (item.id === editingId.value ? updated : item))
      message.value = 'Pertanyaan diperbarui.'
    } else {
      const localId = `q-${Date.now()}`
      const newItem = {
        id: localId,
        text: form.text,
        target: form.target,
        type: form.type,
        options,
        category: form.category,
        statusGroup: form.statusGroup,
      }
      const payload = mapToApi(newItem)
      try {
        const resp = await tracerService.createQuestionBankItem(payload)
        const saved = resp?.data ? mapFromApi(resp.data) : newItem
        questions.value.unshift(saved)
      } catch (err) {
        // fallback lokal jika API gagal
        questions.value.unshift(newItem)
      }
      message.value = 'Pertanyaan ditambahkan.'
    }
    resetForm()
  } catch (err) {
    message.value = err?.message || 'Gagal menyimpan pertanyaan.'
  } finally {
    saving.value = false
  }
}

const handleEdit = (item) => {
  if (bankSoalReadOnly.value) {
    message.value = 'Mode hanya baca. Admin fakultas tidak dapat mengubah bank soal.'
    return
  }
  
  // Check if this is a template question (not saved to database yet)
  if (!isFromDatabase(item.id)) {
    message.value = 'Ini adalah pertanyaan template. Silakan gunakan tombol "Simpan" untuk menyimpan ke database terlebih dahulu.'
    return
  }
  
  editingId.value = item.id
  form.text = item.text
  form.target = item.target
  form.type = item.type
  form.category = item.category
  form.optionsText = item.options?.join('\n') || ''
  form.statusGroup = item.statusGroup || 'umum'
}

const handleDelete = async (item) => {
  if (bankSoalReadOnly.value) {
    message.value = 'Mode hanya baca. Admin fakultas tidak dapat menghapus bank soal.'
    return
  }
  const id = item?.id
  if (!id) return
  
  // Check if this is a template question
  if (!isFromDatabase(id)) {
    // Just remove from local array for templates
    questions.value = questions.value.filter((item) => item.id !== id)
    message.value = 'Pertanyaan template dihapus dari tampilan.'
    return
  }

  try {
    await tracerService.deleteQuestionBankItem(id)
    questions.value = questions.value.filter((item) => item.id !== id)
    if (String(editingId.value) === String(id)) {
      resetForm()
    }
    message.value = 'Pertanyaan berhasil dihapus dari database.'
  } catch (err) {
    message.value = err?.message || 'Gagal menghapus pertanyaan.'
  }
}

// Save template question to database
const handleSaveToDatabase = async (item) => {
  if (saving.value) return
  if (bankSoalReadOnly.value) {
    message.value = 'Mode hanya baca.'
    return
  }
  
  const options = ['select', 'radio', 'checkbox'].includes(item.type)
    ? (item.options || [])
    : []
  
  const payload = mapToApi({
    id: null, // no ID for new item
    text: item.text,
    target: item.target,
    type: item.type,
    options,
    category: item.category,
    statusGroup: item.statusGroup,
  })
  
  saving.value = true
  try {
    const resp = await tracerService.createQuestionBankItem(payload)
    const saved = resp?.data ? mapFromApi(resp.data) : { ...item, id: Date.now() }
    
    // Replace template with database version
    questions.value = questions.value.map((q) => q.id === item.id ? saved : q)
    message.value = `Pertanyaan "${item.text.substring(0, 30)}..." berhasil disimpan ke database.`
  } catch (err) {
    message.value = err?.message || 'Gagal menyimpan ke database.'
  } finally {
    saving.value = false
  }
}

const requestFormSave = () => {
  if (bankSoalReadOnly.value) {
    message.value = 'Mode hanya baca. Admin fakultas tidak dapat mengubah bank soal.'
    return
  }
  if (!form.text.trim()) {
    message.value = 'Teks pertanyaan wajib diisi.'
    return
  }
  if (saving.value) return
  saveIntent.value = 'form'
  pendingTemplateSave.value = null
  confirmSaveOpen.value = true
}

const requestTemplateSave = (item) => {
  if (bankSoalReadOnly.value) {
    message.value = 'Mode hanya baca.'
    return
  }
  if (!item) return
  if (saving.value) return
  saveIntent.value = 'template'
  pendingTemplateSave.value = item
  confirmSaveOpen.value = true
}

const closeSaveConfirm = () => {
  if (saving.value) return
  confirmSaveOpen.value = false
}

const confirmSave = async () => {
  if (saving.value) return
  confirmSaveOpen.value = false
  if (saveIntent.value === 'template' && pendingTemplateSave.value) {
    await handleSaveToDatabase(pendingTemplateSave.value)
  } else {
    await handleSubmit()
  }
  pendingTemplateSave.value = null
  saveIntent.value = 'form'
}

const requestDelete = (item) => {
  if (bankSoalReadOnly.value) {
    message.value = 'Mode hanya baca. Admin fakultas tidak dapat menghapus bank soal.'
    return
  }
  if (!item?.id || deleting.value) return
  deleteTarget.value = {
    id: item.id,
    text: item.text || '',
    isDatabase: isFromDatabase(item.id),
  }
  confirmDeleteOpen.value = true
}

const closeDeleteConfirm = () => {
  if (deleting.value) return
  confirmDeleteOpen.value = false
  deleteTarget.value = null
}

const confirmDelete = async () => {
  if (deleting.value || !deleteTarget.value?.id) return
  deleting.value = true
  try {
    await handleDelete(deleteTarget.value)
    confirmDeleteOpen.value = false
    deleteTarget.value = null
  } finally {
    deleting.value = false
  }
}

const mergeWithInitial = (apiItems = []) => {
  // Create a Set of question texts that already exist in the database
  const dbTexts = new Set(apiItems.map((q) => (q.text || '').toLowerCase().trim()))
  
  // Only add template questions if they don't exist in the database yet
  const templates = initialQuestions.filter((template) => {
    const key = (template.text || '').toLowerCase().trim()
    return key && !dbTexts.has(key)
  })
  
  // Combine: database questions first, then unique templates
  return [...apiItems, ...templates]
}

const loadQuestions = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const resp = await tracerService.getQuestionBank()
    const list = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : []
    if (list.length) {
      const mapped = list.map(mapFromApi)
      questions.value = mergeWithInitial(mapped)
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
      <div class="max-w-6xl px-4 py-6 sm:px-6 lg:px-10">
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
        <div
          v-if="bankSoalReadOnly"
          class="rounded-2xl border border-amber-100 bg-amber-50/80 p-3 text-xs font-semibold text-amber-700"
        >
          Mode hanya baca untuk admin fakultas. Penambahan, edit, dan hapus dinonaktifkan.
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
              :disabled="bankSoalReadOnly"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="Tulis pertanyaan..."
            />
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
                <label class="text-sm font-semibold text-slate-900">Untuk</label>
                <select
                  v-model="form.target"
                  :disabled="bankSoalReadOnly"
                  class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
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
              :disabled="bankSoalReadOnly"
              class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
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
              :disabled="bankSoalReadOnly"
              class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
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
              :disabled="bankSoalReadOnly"
              class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="Karier, Kompetensi, Kepuasan..."
            />
          </div>
        </div>
        <div v-if="['select', 'radio', 'checkbox'].includes(form.type)">
          <label class="text-sm font-semibold text-slate-900">Opsi (pisah baris)</label>
          <textarea
            v-model="form.optionsText"
            rows="3"
                :disabled="bankSoalReadOnly"
                class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                placeholder="Contoh: Sangat setuju\nSetuju\nNetral\nTidak setuju"
              />
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                :disabled="bankSoalReadOnly"
                class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                @click="requestFormSave"
              >
                {{ editingId ? 'Perbarui' : 'Tambah' }} Pertanyaan
              </button>
              <button
                type="button"
                :disabled="bankSoalReadOnly"
                class="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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
            v-for="item in paginatedQuestions"
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
                      <span
                        v-if="!isFromDatabase(item.id)"
                        class="rounded-full bg-yellow-50 px-2 py-1 text-[11px] font-semibold text-yellow-700"
                        title="Pertanyaan ini adalah template dan belum disimpan ke database"
                      >
                        📋 Template
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
                    <!-- Save to database button for templates -->
                    <button
                      v-if="!isFromDatabase(item.id)"
                      type="button"
                      :disabled="bankSoalReadOnly"
                      class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                      @click="requestTemplateSave(item)"
                      title="Simpan pertanyaan ini ke database"
                    >
                      💾 Simpan
                    </button>
                    
                    <button
                      type="button"
                      :disabled="bankSoalReadOnly"
                      class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      @click="handleEdit(item)"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      :disabled="bankSoalReadOnly"
                      class="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      @click="requestDelete(item)"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
              <p v-if="!filteredQuestions.length" class="text-sm text-slate-500">Belum ada pertanyaan yang cocok.</p>
              <div
                v-if="filteredQuestions.length"
                class="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700 md:flex-row md:items-center md:justify-between"
              >
                <div class="flex items-center gap-2">
                  <span>Halaman {{ currentPage }} dari {{ totalPages }}</span>
                  <span class="text-slate-500">
                    | Menampilkan {{ showingRange.start }}-{{ showingRange.end }} dari {{ showingRange.total }}
                  </span>
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
            </div>
          </div>
        </div>
      </div>
      </div>
    </template>
  </AdminShell>
  <Transition name="alert-dialog">
    <div
      v-if="confirmSaveOpen"
      class="alert-dialog-backdrop fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4 py-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="bank-soal-save-confirm-title"
      aria-describedby="bank-soal-save-confirm-desc"
      @click.self="closeSaveConfirm"
    >
      <div class="alert-dialog-panel w-full max-w-md rounded-2xl bg-white p-6 shadow-xl shadow-slate-900/20">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600">Konfirmasi</p>
            <h3 id="bank-soal-save-confirm-title" class="text-lg font-semibold text-slate-900">
              {{
                saveIntent === 'template'
                  ? 'Simpan pertanyaan template?'
                  : editingId
                    ? 'Simpan perubahan pertanyaan?'
                    : 'Simpan pertanyaan baru?'
              }}
            </h3>
            <p id="bank-soal-save-confirm-desc" class="mt-2 text-sm text-slate-600">
              <template v-if="saveIntent === 'template'">
                Pertanyaan template
                <span class="font-semibold text-slate-900">{{ pendingTemplateSave?.text || 'tanpa teks' }}</span>
                akan disimpan ke database.
              </template>
              <template v-else>
                Pertanyaan
                <span class="font-semibold text-slate-900">{{ form.text || 'tanpa teks' }}</span>
                akan disimpan ke sistem.
              </template>
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
            :disabled="saving"
            @click="confirmSave"
          >
            {{ saving ? 'Menyimpan...' : 'Ya, simpan' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
  <Transition name="alert-dialog">
    <div
      v-if="confirmDeleteOpen"
      class="alert-dialog-backdrop fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4 py-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="bank-soal-delete-confirm-title"
      aria-describedby="bank-soal-delete-confirm-desc"
      @click.self="closeDeleteConfirm"
    >
      <div class="alert-dialog-panel w-full max-w-md rounded-2xl bg-white p-6 shadow-xl shadow-slate-900/20">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600">Konfirmasi</p>
            <h3 id="bank-soal-delete-confirm-title" class="text-lg font-semibold text-slate-900">
              Hapus pertanyaan ini?
            </h3>
            <p id="bank-soal-delete-confirm-desc" class="mt-2 text-sm text-slate-600">
              <template v-if="deleteTarget?.isDatabase">
                Pertanyaan
                <span class="font-semibold text-slate-900">{{ deleteTarget?.text || 'tanpa teks' }}</span>
                akan dihapus dari database.
              </template>
              <template v-else>
                Pertanyaan template
                <span class="font-semibold text-slate-900">{{ deleteTarget?.text || 'tanpa teks' }}</span>
                akan dihapus dari tampilan.
              </template>
            </p>
          </div>
          <button
            type="button"
            class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            @click="closeDeleteConfirm"
          >
            Tutup
          </button>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            @click="closeDeleteConfirm"
          >
            Batal
          </button>
          <button
            type="button"
            class="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-60"
            :disabled="deleting"
            @click="confirmDelete"
          >
            {{ deleting ? 'Menghapus...' : 'Ya, hapus' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
  <LoadingOverlay :active="loading" />
</template>

