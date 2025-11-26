import { computed, reactive } from 'vue'
import alumniService from '@/services/alumniService'

const STORAGE_KEY = 'tracer_admin_alumni'
const API_URL = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/alumni` : null
const canUseApi = !!import.meta.env.VITE_API_BASE_URL

const defaultAlumni = [
  {
    nama: 'Laila Putri',
    nim: '190102001',
    prodi: 'Informatika',
    fakultas: 'Teknik',
    tahunLulus: 2023,
    tahunMasuk: 2019,
    nik: '320101230001',
    noHp: '081234567001',
    alamat: 'Jl. Merpati No. 12, Bandung',
    dob: '1999-03-12',
  },
  {
    nama: 'Rizky Pratama',
    nim: '190102014',
    prodi: 'Sistem Informasi',
    fakultas: 'Teknik',
    tahunLulus: 2022,
    tahunMasuk: 2018,
    nik: '320101230014',
    noHp: '081234567014',
    alamat: 'Jl. Kenari No. 8, Jakarta',
    dob: '1998-11-05',
  },
  {
    nama: 'Nanda Saputra',
    nim: '190301022',
    prodi: 'Manajemen',
    fakultas: 'Ekonomi',
    tahunLulus: 2021,
    tahunMasuk: 2017,
    nik: '320101230022',
    noHp: '081234567022',
    alamat: 'Jl. Mawar No. 21, Surabaya',
    dob: '1997-07-21',
  },
  {
    nama: 'Aulia Rahman',
    nim: '190204011',
    prodi: 'Hukum',
    fakultas: 'Hukum',
    tahunLulus: 2020,
    tahunMasuk: 2016,
    nik: '320101230011',
    noHp: '081234567011',
    alamat: 'Jl. Kamboja No. 5, Yogyakarta',
    dob: '1996-02-17',
  },
  {
    nama: 'Dewi Kusuma',
    nim: '190501008',
    prodi: 'Psikologi',
    fakultas: 'Psikologi',
    tahunLulus: 2023,
    tahunMasuk: 2019,
    nik: '320101230008',
    noHp: '081234567008',
    alamat: 'Jl. Anggrek No. 17, Semarang',
    dob: '1999-09-09',
  },
  {
    nama: 'Samuel Hutabarat',
    nim: '190402031',
    prodi: 'Akuntansi',
    fakultas: 'Ekonomi',
    tahunLulus: 2022,
    tahunMasuk: 2018,
    nik: '320101230031',
    noHp: '081234567031',
    alamat: 'Jl. Diponegoro No. 45, Medan',
    dob: '1998-01-30',
  },
  {
    nama: 'Mega Lestari',
    nim: '190103019',
    prodi: 'Teknik Sipil',
    fakultas: 'Teknik',
    tahunLulus: 2020,
    tahunMasuk: 2016,
    nik: '320101230019',
    noHp: '081234567019',
    alamat: 'Jl. Gatot Subroto No. 88, Bandung',
    dob: '1996-12-11',
  },
  {
    nama: 'Bagas Mahendra',
    nim: '190602041',
    prodi: 'Ilmu Komunikasi',
    fakultas: 'Ilmu Sosial',
    tahunLulus: 2021,
    tahunMasuk: 2017,
    nik: '320101230041',
    noHp: '081234567041',
    alamat: 'Jl. Cendana No. 3, Depok',
    dob: '1997-05-25',
  },
  {
    nama: 'Salsa Nirmala',
    nim: '190701055',
    prodi: 'Keperawatan',
    fakultas: 'Kesehatan',
    tahunLulus: 2022,
    tahunMasuk: 2018,
    nik: '320101230055',
    noHp: '081234567055',
    alamat: 'Jl. Melati No. 6, Malang',
    dob: '1998-08-14',
  },
  {
    nama: 'Dani Firmansyah',
    nim: '190802009',
    prodi: 'Pendidikan Matematika',
    fakultas: 'Keguruan',
    tahunLulus: 2023,
    tahunMasuk: 2019,
    nik: '320101230009',
    noHp: '081234567009',
    alamat: 'Jl. Teratai No. 9, Bandung',
    dob: '1999-04-02',
  },
]

const state = reactive({
  items: [],
  loading: false,
  error: '',
})

const randomId = () =>
  (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : Date.now().toString())

const normalizeAlumni = (list = []) => {
  const today = new Date()
  return list
    .filter(Boolean)
    .map((item, idx) => {
      const nim = String(item.nim || item.studentId || `AL-${idx + 1}`)
      const tahunLulus = Number(item.tahunLulus ?? item.graduationYear ?? '') || ''
      const tahunMasuk = Number(item.tahunMasuk ?? item.entryYear ?? (tahunLulus ? tahunLulus - 4 : '')) || ''
      const fallbackNik = `3201${nim.slice(-8).padStart(8, '0')}`
      const fallbackPhone = `0812${nim.slice(-6).padStart(6, '0')}`
      const fallbackAddress = item.alamat || item.address || `Alamat alumni ${idx + 1}`
      const fallbackDob = item.dob || item.tglLahir || item.birthDate || `${1995 + (idx % 10)}-0${(idx % 9) + 1}-1${idx % 9}`

      return {
        id: item.id ?? nim ?? `alumni-${idx}`,
        nama: item.nama || item.name || 'Alumni',
        nim,
        prodi: item.prodi || item.programStudi || item.program || '-',
        fakultas: item.fakultas || item.faculty || '-',
        tahunLulus,
        tahunMasuk,
        nik: item.nik || item.nationalId || fallbackNik,
        noHp: item.noHp || item.phone || fallbackPhone,
        alamat: fallbackAddress,
        foto: item.foto || item.photoUrl || item.avatar || '',
        dob: fallbackDob,
        updatedAt: item.updatedAt || item.createdAt || today.toISOString(),
        sent: !!item.sent,
      }
    })
}

const persist = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
}

const loadLocal = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const normalized = normalizeAlumni(parsed)
      if (normalized.length) {
        state.items = normalized
      }
    }
  } catch (e) {
    state.items = []
  }
}

const seedDefault = () => {
  state.items = normalizeAlumni(defaultAlumni)
  persist()
}

export const useAlumni = () => {
  const alumni = computed(() => state)

  const fetchAlumni = async (params = {}) => {
    state.loading = true
    state.error = ''
    try {
      if (canUseApi) {
        const resp = await alumniService.getAlumni(params)
        const list = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : []
        const normalized = normalizeAlumni(list)
        if (normalized.length) {
          state.items = normalized
          persist()
          return
        }
      }
      loadLocal()
      if (!state.items.length) {
        seedDefault()
      }
    } catch (err) {
      state.error = err?.message || 'Gagal memuat data alumni.'
      if (!state.items.length) {
        loadLocal()
        if (!state.items.length) {
          seedDefault()
        }
      }
    } finally {
      state.loading = false
    }
  }

  const addAlumni = (payload) => {
    const nim = payload.nim?.trim() || `AL-${state.items.length + 1}`
    const tahunLulus = Number(payload.tahunLulus) || ''
    const tahunMasuk = Number(payload.tahunMasuk ?? (tahunLulus ? tahunLulus - 4 : '')) || ''
    const fallbackNik = `3201${nim.slice(-8).padStart(8, '0')}`
    const fallbackPhone = `0812${nim.slice(-6).padStart(6, '0')}`
    const item = {
      id: payload.id ?? nim ?? randomId(),
      nama: payload.nama?.trim() || 'Alumni',
      nim,
      prodi: payload.prodi?.trim() || '-',
      fakultas: payload.fakultas?.trim() || '-',
      tahunLulus,
      tahunMasuk,
      nik: (payload.nik || payload.nationalId || fallbackNik).toString(),
      noHp: (payload.noHp || payload.phone || fallbackPhone).toString(),
      alamat: payload.alamat?.trim() || payload.address?.trim() || `Alamat alumni ${state.items.length + 1}`,
      foto: payload.foto || payload.photoUrl || payload.avatar || '',
      dob: payload.dob || payload.birthDate || payload.tglLahir || '',
      updatedAt: new Date().toISOString(),
      sent: !!payload.sent,
    }
    state.items.unshift(item)
    persist()
    return item
  }

  const updateAlumni = (id, payload) => {
    const index = state.items.findIndex(
      (item) => String(item.id) === String(id) || String(item.nim) === String(id),
    )
    if (index === -1) {
      throw new Error('Alumni tidak ditemukan.')
    }
    state.items[index] = {
      ...state.items[index],
      ...payload,
      tahunLulus: Number(payload.tahunLulus ?? state.items[index].tahunLulus) || '',
      updatedAt: new Date().toISOString(),
      sent: payload.sent ?? state.items[index].sent ?? false,
    }
    persist()
    return state.items[index]
  }

  const getAlumniById = (id) =>
    state.items.find((item) => String(item.id) === String(id) || String(item.nim) === String(id)) || null

  const fetchAlumniById = async (id) => {
    if (!id) return null
    try {
      if (canUseApi) {
        const resp = await alumniService.getAlumniById(id)
        const item = resp?.data || resp
        if (item) return normalizeAlumni([item])[0]
      }
      return getAlumniById(id)
    } catch (err) {
      state.error = err?.message || 'Gagal mengambil data alumni'
      return getAlumniById(id)
    }
  }

  const exportAlumniCsv = (dataset = state.items) => {
    const rows = dataset.length ? dataset : state.items
    const header = ['Nama', 'NIM', 'Prodi', 'Fakultas', 'Tahun Lulus']
    const csv = [header.join(',')]
      .concat(
        rows.map((item) =>
          [
            item.nama,
            item.nim,
            item.prodi,
            item.fakultas,
            item.tahunLulus || '',
          ]
            .map((field) => `"${String(field).replace(/"/g, '""')}"`)
            .join(','),
        ),
      )
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `alumni-${new Date().toISOString().slice(0, 10)}.csv`)
    link.click()
    URL.revokeObjectURL(url)
  }

  const markSent = (ids = []) => {
    const targetIds = Array.isArray(ids) ? ids : [ids]
    let updated = false
    state.items = state.items.map((item) => {
      if (targetIds.some((id) => String(id) === String(item.id) || String(id) === String(item.nim))) {
        updated = true
      return { ...item, sent: true, updatedAt: new Date().toISOString() }
    }
    return item
  })
  if (updated) {
    persist()
  }
}

  return {
    alumni,
    fetchAlumni,
    addAlumni,
    updateAlumni,
    getAlumniById,
    fetchAlumniById,
    exportAlumniCsv,
    markSent,
  }
}
