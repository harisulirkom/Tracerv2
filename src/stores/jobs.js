import { computed, reactive } from 'vue'
import jobService from '@/services/jobService'

const STORAGE_KEY = 'cdc_jobs'
const canUseApi = !!import.meta.env.VITE_API_BASE_URL

const DEFAULT_JOBS = [
  {
    id: 'backend-01',
    title: 'Software Engineer (Backend)',
    company: 'PT Nusantara Digital',
    companyProfile:
      'Perusahaan teknologi yang membangun platform SaaS untuk klien enterprise, budaya kerja kolaboratif dengan fokus pada ownership.',
    location: 'Jakarta',
    workMode: 'Hybrid',
    jobType: 'Full-time',
    category: 'kerja',
    deadline: '2025-02-12',
    summary:
      'Mengembangkan layanan backend yang andal dan scalable untuk produk SaaS dengan praktik clean code, testing, dan observability.',
    responsibilities: [
      'Merancang dan membangun API/RESTful service untuk fitur utama produk.',
      'Menulis kode yang terukur, teruji (unit/integration), dan terdokumentasi.',
      'Melakukan code review serta kolaborasi dengan tim frontend dan QA.',
      'Mengoptimalkan performa query database serta caching.',
      'Menjaga keamanan aplikasi termasuk autentikasi, otorisasi, dan logging.',
    ],
    qualifications: {
      education: 'Minimal S1 Informatika/Sistem Informasi atau bidang terkait.',
      experience: '2-4 tahun pengalaman sebagai Backend Engineer atau Software Engineer.',
      skills: [
        'Node.js/Express atau NestJS, REST API, JSON',
        'Basis data SQL/NoSQL (PostgreSQL, MongoDB) dan ORM',
        'Version control (Git), CI/CD dasar, dan container (Docker)',
        'Praktik clean architecture, testing, dan troubleshooting',
        'Komunikasi tim, problem solving, dan integritas tinggi',
      ],
      other: ['Domisili Jabodetabek diutamakan', 'Mampu bekerja hybrid di Jakarta (3 hari onsite)'],
    },
    compensation: 'Rp10-15 jt/bulan, BPJS Kesehatan/Ketenagakerjaan, tunjangan internet, bonus proyek.',
    benefits: ['Asuransi kesehatan', 'WFH allowance', 'Training/sertifikasi', 'Laptop & tools kerja'],
    apply:
      'Kirim CV + portfolio Github ke careers@nusantaradigital.id dengan subjek: Backend_[Nama]. Portofolio API/service sangat dianjurkan.',
  },
  {
    id: 'data-02',
    title: 'Analis Data Pendidikan',
    company: 'EduTech Insight',
    companyProfile: 'Startup edutech yang fokus pada analitik pembelajaran dan rekomendasi kurikulum adaptif.',
    location: 'Yogyakarta',
    workMode: 'Onsite',
    jobType: 'Full-time',
    category: 'kerja',
    deadline: '2025-02-18',
    summary:
      'Mengolah data pembelajaran untuk menghasilkan insight, dashboard, dan rekomendasi kurikulum yang berdampak.',
    responsibilities: [
      'Membersihkan dan memodelkan data siswa/dosen/kurikulum.',
      'Membangun dashboard KPI pendidikan (retensi, engagement, hasil belajar).',
      'Berkoordinasi dengan tim produk untuk eksperimen A/B dan rekomendasi konten.',
      'Menyusun dokumentasi data dan data dictionary.',
    ],
    qualifications: {
      education: 'Minimal S1 Statistika, Matematika, Informatika, atau bidang terkait.',
      experience: '1-3 tahun sebagai Data Analyst atau Business Intelligence.',
      skills: ['SQL tingkat lanjut dan visualisasi (Metabase/Tableau/Power BI)', 'Python (pandas) untuk eksplorasi dan preprocessing', 'Dasar statistik inferensial dan A/B testing', 'Komunikasi bisnis dan penyusunan deck insight'],
      other: ['Terbiasa bekerja dengan data pendidikan atau edutech menjadi nilai plus'],
    },
    compensation: 'Rp8-12 jt/bulan, BPJS, budget training tahunan, makan siang.',
    benefits: ['Kelas pengembangan diri', 'Skema cuti tambahan', 'Coaching karier'],
    apply: 'Kirim CV + contoh dashboard/portofolio ke talent@edutechinsight.id, subjek: DA_EDU_[Nama].',
  },
  {
    id: 'design-03',
    title: 'UI/UX Designer',
    company: 'Kreatif Studio',
    companyProfile: 'Agensi kreatif digital yang mengerjakan produk mobile/web untuk klien internasional.',
    location: 'Bandung',
    workMode: 'Remote',
    jobType: 'Kontrak 12 bulan',
    category: 'kerja',
    deadline: '2025-02-22',
    summary: 'Merancang pengalaman pengguna end-to-end, dari riset, wireframe, hingga design system siap dev.',
    responsibilities: [
      'Melakukan riset singkat dan merumuskan problem statement.',
      'Membuat wireframe, user flow, dan prototipe interaktif.',
      'Menyusun UI kit/design system dan handoff ke developer.',
      'Berkoordinasi dengan klien untuk iterasi desain.',
    ],
    qualifications: {
      education: 'Minimal D3/S1 semua jurusan, diutamakan DKV/Desain Produk/Informatika.',
      experience: 'Minimal 2 tahun di UI/UX dengan portofolio produk digital.',
      skills: ['Figma (auto layout, variant, prototyping)', 'Dasar UX writing dan accessibility', 'Kolaborasi dengan developer (design token)', 'Bahasa Inggris dasar untuk komunikasi klien'],
      other: ['Portofolio wajib disertakan', 'Ketersediaan untuk weekly sprint review'],
    },
    compensation: 'Rp9-13 jt/bulan (kontrak), tunjangan remote, bonus berbasis proyek.',
    benefits: ['Budget tools/plug-in', 'Sesi mentoring desain', 'Flexible working hour'],
    apply: 'Kirim CV + portofolio (Figma/website) ke hello@kreatifstudio.id, subjek: UIUX_[Nama].',
  },
  {
    id: 'bd-04',
    title: 'Internship - Business Development',
    company: 'Mitra Sinergi Group',
    companyProfile: 'Holding yang bergerak di distribusi FMCG dan kemitraan retail nasional.',
    location: 'Semarang',
    workMode: 'Onsite',
    jobType: 'Magang (3-6 bulan)',
    category: 'magang',
    deadline: '2025-02-28',
    summary: 'Mendukung tim BD dalam riset pasar, prospek klien, dan penyusunan proposal kemitraan.',
    responsibilities: [
      'Menyusun daftar prospek dan melakukan outreach awal.',
      'Mendukung pembuatan materi presentasi dan proposal kerja sama.',
      'Melakukan riset kompetitor dan tren pasar.',
      'Merapikan CRM dan laporan mingguan.',
    ],
    qualifications: {
      education: 'Mahasiswa tingkat akhir atau fresh graduate semua jurusan.',
      experience: 'Pengalaman organisasi/komunitas sebagai nilai tambah.',
      skills: ['Presentasi dan komunikasi bisnis', 'Kemampuan riset dan olah data sederhana (Excel/Sheets)', 'Dasar negosiasi dan customer focus'],
      other: ['Bersedia onsite di Semarang', 'Memiliki kendaraan menjadi nilai plus'],
    },
    compensation: 'Uang saku Rp1,5-2 jt/bulan, makan siang, sertifikat magang.',
    benefits: ['Kesempatan fast track ke posisi full-time', 'Pelatihan sales dasar', 'Relasi industri FMCG'],
    apply: 'Kirim CV ke recruitment@mitrasinergi.co.id, subjek: InternBD_[Nama].',
  },
  {
    id: 'pkl-05',
    title: 'PKL Laboratorium Teknik',
    company: 'Politeknik Mitra Industri',
    companyProfile: 'Lembaga vokasi yang membuka PKL di laboratorium manufaktur dan otomasi.',
    location: 'Kediri',
    workMode: 'Onsite',
    jobType: 'PKL 3 bulan',
    category: 'pkl',
    deadline: '2025-03-05',
    summary: 'Praktik kerja lapangan membantu operasional lab, kalibrasi peralatan, dan asistensi praktikum.',
    responsibilities: [
      'Membantu dosen/instruktur menyiapkan alat praktikum.',
      'Melakukan pencatatan dan kalibrasi sederhana peralatan lab.',
      'Mendampingi praktikan selama sesi praktikum.',
      'Menyusun laporan harian kondisi peralatan.',
    ],
    qualifications: {
      education: 'Mahasiswa D3/S1 Teknik Mesin/Elektro semester akhir.',
      experience: 'Pengalaman asisten lab menjadi nilai tambah.',
      skills: ['Dasar K3 laboratorium', 'Pemahaman alat ukur mekanik/elektrik', 'Disiplin dan teliti'],
      other: ['Bersedia onsite penuh selama PKL'],
    },
    compensation: 'Uang saku transport dan sertifikat PKL.',
    benefits: ['Pendampingan instruktur', 'Akses pelatihan dasar K3', 'Rujukan rekomendasi'],
    apply: 'Kirim CV dan surat pengantar kampus ke pkllab@pmi.ac.id dengan subjek: PKL_Lab_[Nama].',
  },
]

const state = reactive({
  items: [],
  loading: false,
  error: '',
})

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      state.items = JSON.parse(raw)
    }
  } catch (e) {
    state.items = []
  }

  if (!Array.isArray(state.items) || !state.items.length) {
    state.items = [...DEFAULT_JOBS]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
  }
}

const save = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
}

const ensureArray = (value) => {
  if (Array.isArray(value)) return value.filter((item) => Boolean(item && String(item).trim()))
  return String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

const normalizeJob = (payload = {}) => ({
  id: payload.id || (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()),
  createdAt: payload.createdAt || new Date().toISOString(),
  title: payload.title || 'Posisi',
  company: payload.company || 'Perusahaan',
  companyProfile: payload.companyProfile || '',
  location: payload.location || '-',
  workMode: payload.workMode || 'Onsite',
  jobType: payload.jobType || 'Full-time',
  category: payload.category || 'kerja',
  deadline: payload.deadline || '',
  summary: payload.summary || '',
  responsibilities: ensureArray(payload.responsibilities),
  qualifications: {
    education: payload.qualifications?.education || '',
    experience: payload.qualifications?.experience || '',
    skills: ensureArray(payload.qualifications?.skills),
    other: ensureArray(payload.qualifications?.other),
  },
  compensation: payload.compensation || '',
  benefits: ensureArray(payload.benefits),
  apply: payload.apply || '',
})

load()

export const useJobs = () => {
  const fetchJobs = async (params = {}) => {
    state.loading = true
    state.error = ''
    try {
      if (canUseApi) {
        const resp = await jobService.getJobs(params)
        const list = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : []
        if (list.length) {
          state.items = list.map(normalizeJob)
          save()
          return
        }
      }
      if (!state.items.length) load()
    } catch (err) {
      state.error = err?.message || 'Gagal memuat lowongan'
      if (!state.items.length) load()
    } finally {
      state.loading = false
    }
  }

  const addJob = async (payload) => {
    if (canUseApi) {
      try {
        const resp = await jobService.createJob(payload)
        const job = normalizeJob(resp?.data || resp)
        state.items.unshift(job)
        save()
        return job.id
      } catch (err) {
        state.error = err?.message || 'Gagal menambah lowongan'
      }
    }
    const job = normalizeJob(payload)
    state.items.unshift(job)
    save()
    return job.id
  }

  const updateJob = async (id, payload) => {
    const index = state.items.findIndex((item) => item.id === id)
    if (index === -1) return
    if (canUseApi) {
      try {
        const resp = await jobService.updateJob(id, payload)
        state.items[index] = normalizeJob({ ...resp?.data, id })
        save()
        return
      } catch (err) {
        state.error = err?.message || 'Gagal memperbarui lowongan'
      }
    }
    state.items[index] = normalizeJob({ ...state.items[index], ...payload, id, createdAt: state.items[index].createdAt })
    save()
  }

  const deleteJob = async (id) => {
    if (canUseApi) {
      try {
        await jobService.deleteJob(id)
      } catch (err) {
        state.error = err?.message || 'Gagal menghapus lowongan'
      }
    }
    const index = state.items.findIndex((item) => item.id === id)
    if (index === -1) return
    state.items.splice(index, 1)
    save()
  }

  const getJobById = (id) => state.items.find((item) => item.id === id) || null

  return {
    jobs: computed(() => state.items),
    addJob,
    updateJob,
    deleteJob,
    getJobById,
    fetchJobs,
    loading: computed(() => state.loading),
    error: computed(() => state.error),
  }
}
