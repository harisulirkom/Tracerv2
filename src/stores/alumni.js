import { computed, reactive } from 'vue'
import alumniService from '@/services/alumniService'
import api from '@/services/api'
import { API_TIMEOUT_MS } from '@/services/requestTimeout'

const STORAGE_KEY = 'tracer_admin_alumni'
const TOKEN_STORAGE_KEY = 'tracer_auth_token'
const API_URL = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/alumni` : null
const canUseApi = !!import.meta.env.VITE_API_BASE_URL
const DEFAULT_PER_PAGE = 'all'

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
  meta: {
    total: 0,
  },
})

const randomId = () =>
  (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : Date.now().toString())

const normalizeAlumni = (list = []) => {
  const today = new Date()
  return list
    .filter(Boolean)
    .map((item, idx) => {
      const nim = String(item.nim || item.studentId || `AL-${idx + 1}`)
      const rawEmail =
        item.email ||
        item.email_address ||
        item.mail ||
        item.alamatEmail ||
        item.emailAddress ||
        ''
      const fallbackEmail = rawEmail || (nim ? `${nim}@import.local` : '')
      const tahunLulus = Number(item.tahunLulus ?? item.graduationYear ?? '') || ''
      const tahunMasuk = Number(item.tahunMasuk ?? item.entryYear ?? (tahunLulus ? tahunLulus - 4 : '')) || ''
      const rawNik =
        item.nik ||
        item.nik_alumni ||
        item.no_ktp ||
        item.ktp ||
        item.nationalId ||
        item.national_id ||
        ''
      const rawNoHp =
        item.noHp ||
        item.no_hp ||
        item.hp ||
        item.phone ||
        item.nomor_hp ||
        item.phone_number ||
        ''
      const rawAlamat =
        item.alamat ||
        item.alamat_alumni ||
        item.alamat_mahasiswa ||
        item.alamat_lengkap ||
        item.alamat_rumah ||
        item.address ||
        ''
      const fallbackNik = `3201${nim.slice(-8).padStart(8, '0')}`
      const fallbackPhone = `0812${nim.slice(-6).padStart(6, '0')}`
      const fallbackAddress = rawAlamat || `Alamat alumni ${idx + 1}`
      const fallbackDob = item.dob || item.tglLahir || item.birthDate || `${1995 + (idx % 10)}-0${(idx % 9) + 1}-1${idx % 9}`

      return {
        id: item.id ?? nim ?? `alumni-${idx}`,
        nama: item.nama || item.name || 'Alumni',
        nim,
        prodi: item.prodi || item.programStudi || item.program || '-',
        fakultas: item.fakultas || item.faculty || '-',
        tahunLulus,
        tahunMasuk,
        nik: rawNik || fallbackNik,
        noHp: rawNoHp || fallbackPhone,
        alamat: fallbackAddress,
        rawNik: rawNik || '',
        rawNoHp: rawNoHp || '',
        rawAlamat: rawAlamat || '',
        email: fallbackEmail,
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

const clearPersisted = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    // ignore storage errors
  }
}

const hasAuthToken = () => {
  if (api?.defaults?.headers?.common?.Authorization) return true
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    return !!parsed?.token
  } catch (e) {
    return false
  }
}

const updateMetaTotal = (value) => {
  state.meta.total = Number(value || 0)
}

const loadLocal = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const normalized = normalizeAlumni(parsed)
      if (normalized.length) {
        state.items = normalized
        updateMetaTotal(normalized.length)
      }
    }
  } catch (e) {
    state.items = []
  }
}

const seedDefault = () => {
  state.items = normalizeAlumni(defaultAlumni)
  updateMetaTotal(state.items.length)
  persist()
}

export const useAlumni = () => {
  const alumni = computed(() => state)

  const fetchAlumni = async (params = {}, options = {}) => {
    const { forceRemote = false } = options
    state.loading = true
    state.error = ''
    const apiReady = canUseApi && hasAuthToken()
    try {
      if (apiReady) {
        const resp = await alumniService.getAlumni({
          per_page: DEFAULT_PER_PAGE,
          ...params,
        }, { timeout: API_TIMEOUT_MS })
        const list = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : []
        const normalized = normalizeAlumni(list)
        state.items = normalized
        clearPersisted()
        persist()
        const total = resp?.meta?.total ?? normalized.length
        updateMetaTotal(total)
        return normalized
      }

      if (canUseApi && !apiReady) {
        state.error = 'Token autentikasi tidak ditemukan. Silakan login ulang untuk memuat data alumni.'
        if (forceRemote) {
          state.items = []
          clearPersisted()
          return []
        }
      }

        loadLocal()
        if (!state.items.length) {
          seedDefault()
        }
      return state.items
    } catch (err) {
      const status = err?.response?.status
      if (status === 401) {
        state.error = 'Sesi berakhir atau token tidak valid. Silakan login ulang.'
        clearPersisted()
      } else {
        state.error = err?.message || 'Gagal memuat data alumni.'
      }

      if (!state.items.length) {
        if (!forceRemote) {
          loadLocal()
          if (!state.items.length && !canUseApi) {
            seedDefault()
          }
        } else {
          state.items = []
          clearPersisted()
        }
      }
      return state.items
    } finally {
      state.loading = false
    }
  }

  const importAlumniCsv = async (file) => {
    if (!file) {
      throw new Error('File CSV belum dipilih.')
    }
    if (!canUseApi) {
      throw new Error('Backend tidak tersedia pada mode offline.')
    }

    const buildFormData = () => {
      const formData = new FormData()
      // Backward compatibility: some backend versions use `file`, others `alumni_csv`.
      formData.append('file', file, file.name)
      formData.append('alumni_csv', file, file.name)
      return formData
    }

    const endpoints = ['/admin/alumni/import', '/alumni/import', '/import-alumni']
    let lastError = null
    let response = null

    for (const endpoint of endpoints) {
      try {
        response = await api.post(endpoint, buildFormData(), {
          // Remove JSON default header so browser can send proper multipart boundary.
          headers: { 'Content-Type': undefined },
        })
        break
      } catch (err) {
        lastError = err
        const status = err?.response?.status
        // Try fallback endpoints only when route/method is unavailable.
        if (status !== 404 && status !== 405) {
          throw err
        }
      }
    }

    if (!response) {
      throw lastError || new Error('Endpoint import alumni tidak ditemukan di server.')
    }

    clearPersisted()
    await fetchAlumni({}, { forceRemote: true })
    return response
  }

  const addAlumni = (payload) => {
    const nim = payload.nim?.trim() || `AL-${state.items.length + 1}`
    const email =
      payload.email?.trim() ||
      payload.email_address?.trim() ||
      payload.mail?.trim() ||
      (nim ? `${nim}@import.local` : '')
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
      email,
      nik: (payload.nik || payload.nationalId || fallbackNik).toString(),
      noHp: (payload.noHp || payload.phone || fallbackPhone).toString(),
      alamat: payload.alamat?.trim() || payload.address?.trim() || `Alamat alumni ${state.items.length + 1}`,
      rawNik: (payload.nik || payload.nationalId || '').toString(),
      rawNoHp: (payload.noHp || payload.phone || '').toString(),
      rawAlamat: (payload.alamat || payload.address || '').toString(),
      foto: payload.foto || payload.photoUrl || payload.avatar || '',
      dob: payload.dob || payload.birthDate || payload.tglLahir || '',
      updatedAt: new Date().toISOString(),
      sent: !!payload.sent,
    }
    state.items.unshift(item)
    persist()
    return item
  }

  const updateAlumni = async (id, payload) => {
    const index = state.items.findIndex(
      (item) => String(item.id) === String(id) || String(item.nim) === String(id),
    )
    if (index === -1) {
      throw new Error('Alumni tidak ditemukan.')
    }

    const apiReady = canUseApi && hasAuthToken()
    if (apiReady) {
      const requestId = state.items[index]?.id ?? id
      const resp = await alumniService.updateAlumni(requestId, payload)
      const updated = resp?.data || resp
      if (updated) {
        const normalized = normalizeAlumni([updated])[0]
        if (normalized) {
          state.items[index] = {
            ...state.items[index],
            ...normalized,
            updatedAt: normalized.updatedAt || new Date().toISOString(),
          }
          persist()
          return state.items[index]
        }
      }
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
    const header = ['Nama', 'NIM', 'Prodi', 'Fakultas', 'Tahun Lulus', 'Email']
    const csv = [header.join(',')]
      .concat(
        rows.map((item) =>
          [
            item.nama,
            item.nim,
            item.prodi,
            item.fakultas,
            item.tahunLulus || '',
            item.email || '',
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
    importAlumniCsv,
  }
}
