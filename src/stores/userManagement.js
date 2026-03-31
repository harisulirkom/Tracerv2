import { computed, reactive } from 'vue'
import userService from '@/services/userService'
import { ensurePasswordHash } from '@/utils/password'

const STORAGE_KEY = 'cdc_users_management'
const DEFAULT_PASSWORD = 'admin123'
const DEFAULT_PASSWORD_HASH = ensurePasswordHash(DEFAULT_PASSWORD, DEFAULT_PASSWORD)
const canUseApi = !!import.meta.env.VITE_API_BASE_URL

const ROLES = ['Super Admin', 'Admin Universitas', 'Admin Fakultas', 'Admin Prodi']

const facultiesSample = [
  'Fakultas Tarbiyah',
  'Fakultas Syariah',
  'Fakultas Ushuluddin dan Dakwah',
  'Fakultas Ekonomi dan Bisnis Islam',
  'Pascasarjana',
]
const prodiSample = [
  { name: 'Pendidikan Agama Islam', faculty: 'Fakultas Tarbiyah' },
  { name: 'Pendidikan Bahasa Arab', faculty: 'Fakultas Tarbiyah' },
  { name: 'Pendidikan Guru Madrasah Ibtidaiyah', faculty: 'Fakultas Tarbiyah' },
  { name: 'Pendidikan Profesi Guru', faculty: 'Fakultas Tarbiyah' },
  { name: 'Tadris Bahasa Indonesia', faculty: 'Fakultas Tarbiyah' },
  { name: 'Tadris Bahasa Inggris', faculty: 'Fakultas Tarbiyah' },
  { name: 'Tadris IPA', faculty: 'Fakultas Tarbiyah' },
  { name: 'Tadris Matematika', faculty: 'Fakultas Tarbiyah' },
  { name: 'Hukum Ekonomi Syariah (Muamalah)', faculty: 'Fakultas Syariah' },
  { name: 'Hukum Keluarga Islam (Ahwal Syakhshiyyah)', faculty: 'Fakultas Syariah' },
  { name: "Hukum Tatanegara (Siyasah Syar'iyyah)", faculty: 'Fakultas Syariah' },
  { name: 'Aqidah dan Filsafat Islam', faculty: 'Fakultas Ushuluddin dan Dakwah' },
  { name: 'Ilmu al-Quran dan Tafsir', faculty: 'Fakultas Ushuluddin dan Dakwah' },
  { name: 'Ilmu Hadis', faculty: 'Fakultas Ushuluddin dan Dakwah' },
  { name: 'Jurnalistik Islam', faculty: 'Fakultas Ushuluddin dan Dakwah' },
  { name: 'Komunikasi dan Penyiaran Islam', faculty: 'Fakultas Ushuluddin dan Dakwah' },
  { name: 'Psikologi Islam', faculty: 'Fakultas Ushuluddin dan Dakwah' },
  { name: 'Sosiologi Agama', faculty: 'Fakultas Ushuluddin dan Dakwah' },
  { name: 'Studi Agama Agama', faculty: 'Fakultas Ushuluddin dan Dakwah' },
  { name: 'Tasawuf dan Psikoterapi', faculty: 'Fakultas Ushuluddin dan Dakwah' },
  { name: 'Manajemen Haji dan Umrah', faculty: 'Fakultas Ushuluddin dan Dakwah' },
  { name: 'Akuntansi Syariah', faculty: 'Fakultas Ekonomi dan Bisnis Islam' },
  { name: 'Ekonomi Syariah', faculty: 'Fakultas Ekonomi dan Bisnis Islam' },
  { name: 'Manajemen Bisnis Syariah', faculty: 'Fakultas Ekonomi dan Bisnis Islam' },
  { name: 'Perbankan Syariah', faculty: 'Fakultas Ekonomi dan Bisnis Islam' },
  { name: 'S2 Ekonomi Syariah', faculty: 'Pascasarjana' },
  { name: 'S2 Hukum Keluarga Islam (Ahwal Syakhshiyyah)', faculty: 'Pascasarjana' },
  { name: "S2 Ilmu Al-Qur'an dan Tafsir", faculty: 'Pascasarjana' },
  { name: 'S2 Manajemen Pendidikan Islam', faculty: 'Pascasarjana' },
  { name: 'S2 Pendidikan Agama Islam', faculty: 'Pascasarjana' },
  { name: 'S2 Pendidikan Bahasa Arab', faculty: 'Pascasarjana' },
  { name: 'S3 Studi Islam', faculty: 'Pascasarjana' },
]

const MENU_PERMISSION_KEYS = [
  'ikhtisar',
  'kuisioner',
  'alumni',
  'bankSoal',
  'cta',
  'lowongan',
  'artikel',
  'user',
  'berita',
]
const EXTRA_PERMISSION_KEYS = ['alumniEdit']

const defaultUsers = [
  {
    id: 'u-1',
    name: 'Rita Rahmania',
    fullName: 'Rita Rahmania',
    email: 'admin@tracer.local',
    phone: '081234567890',
    nip: '198001012008012001',
    role: 'Super Admin',
    faculty: '',
    prodi: '',
    status: 'Aktif',
    password: DEFAULT_PASSWORD_HASH,
    createdAt: '2024-12-20T08:00:00Z',
    lastLogin: '2025-01-10T08:00:00Z',
  },
  {
    id: 'u-2',
    name: 'Budi Santoso',
    fullName: 'Budi Santoso',
    email: 'budi@kampus.ac.id',
    phone: '081200011122',
    nip: '197912122010111001',
    role: 'Admin Universitas',
    faculty: '',
    prodi: '',
    status: 'Aktif',
    password: DEFAULT_PASSWORD_HASH,
    createdAt: '2025-01-05T09:00:00Z',
    lastLogin: '2025-01-11T09:00:00Z',
  },
  {
    id: 'u-3',
    name: 'Maya Putri',
    fullName: 'Maya Putri',
    email: 'maya@fekon.ac.id',
    phone: '081300022233',
    nip: '198502052012112002',
    role: 'Admin Fakultas',
    faculty: 'Fakultas Ekonomi dan Bisnis Islam',
    prodi: '',
    status: 'Aktif',
    password: DEFAULT_PASSWORD_HASH,
    createdAt: '2025-01-07T10:00:00Z',
    lastLogin: '2025-01-10T12:00:00Z',
  },
  {
    id: 'u-4',
    name: 'Dian Saputra',
    fullName: 'Dian Saputra',
    email: 'dian@si.ac.id',
    phone: '081400033344',
    nip: '199002122019121003',
    role: 'Admin Prodi',
    faculty: 'Fakultas Tarbiyah',
    prodi: 'Tadris Bahasa Inggris',
    status: 'Nonaktif',
    password: DEFAULT_PASSWORD_HASH,
    createdAt: '2025-01-08T11:00:00Z',
    lastLogin: '2025-01-09T11:30:00Z',
  },
]

const createDefaultPermissions = () => ({
  'Super Admin': {
    ikhtisar: true,
    kuisioner: true,
    alumni: true,
    alumniEdit: true,
    bankSoal: true,
    cta: true,
    lowongan: true,
    artikel: true,
    user: true,
    berita: true,
  },
  'Admin Universitas': {
    ikhtisar: true,
    kuisioner: true,
    alumni: true,
    alumniEdit: false,
    bankSoal: true,
    cta: true,
    lowongan: true,
    artikel: true,
    user: true,
    berita: true,
  },
  'Admin Fakultas': {
    ikhtisar: true,
    kuisioner: true,
    alumni: true,
    alumniEdit: false,
    bankSoal: true,
    cta: false,
    lowongan: true,
    artikel: false,
    user: false,
    berita: false,
  },
  'Admin Prodi': {
    ikhtisar: true,
    kuisioner: true,
    alumni: true,
    alumniEdit: false,
    bankSoal: true,
    cta: false,
    lowongan: true,
    artikel: false,
    user: false,
    berita: false,
  },
})

const DEFAULT_PERMISSIONS = createDefaultPermissions()

const state = reactive({
  users: [],
  loading: false,
  error: '',
  permissions: createDefaultPermissions(),
  facultyMapping: facultiesSample.map((name) => ({ name, adminId: '' })),
  prodiMapping: prodiSample.map((item) => ({ name: item.name, faculty: item.faculty, adminId: '' })),
  accessControl: {
    restrictFacultyMenu: true,
    restrictFacultyBankSoalWrite: true,
  },
  auditLogs: [
    {
      id: 'log-1',
      timestamp: '2025-01-10T09:15:00Z',
      user: 'Rita Rahmania',
      role: 'Super Admin',
      unit: 'Universitas',
      action: 'Tambah user',
      target: 'budi@kampus.ac.id',
      ip: '10.0.0.1',
    },
    {
      id: 'log-2',
      timestamp: '2025-01-11T11:20:00Z',
      user: 'Budi Santoso',
      role: 'Admin Universitas',
      unit: 'Universitas',
      action: 'Reset password',
      target: 'dian@si.ac.id',
      ip: '10.0.0.2',
    },
  ],
})

const save = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const ensureUserIntegrity = () => {
  const now = new Date().toISOString()
  state.users = state.users.map((u) => ({
    ...u,
    fullName: u.fullName || u.name,
    username: u.username || (u.email ? u.email.split('@')[0] : ''),
    password: ensurePasswordHash(u.password, DEFAULT_PASSWORD),
    status: u.status || 'Aktif',
    createdAt: u.createdAt || now,
    lastLogin: u.lastLogin || u.createdAt || now,
  }))
}

const syncMappings = () => {
  const existingFaculty = new Map(
    (state.facultyMapping || []).map((item) => [item.name, item.adminId || '']),
  )
  state.facultyMapping = facultiesSample.map((name) => ({
    name,
    adminId: existingFaculty.get(name) || '',
  }))

  const existingProdi = new Map(
    (state.prodiMapping || []).map((item) => [item.name, item.adminId || '']),
  )
  state.prodiMapping = prodiSample.map((item) => ({
    name: item.name,
    faculty: item.faculty,
    adminId: existingProdi.get(item.name) || '',
  }))
}

const resolveLegacyPermission = (rolePerms, key) => {
  if (rolePerms && Object.prototype.hasOwnProperty.call(rolePerms, key)) {
    return rolePerms[key]
  }
  return undefined
}

const ensurePermissionIntegrity = () => {
  Object.keys(DEFAULT_PERMISSIONS).forEach((role) => {
    if (!state.permissions[role]) {
      state.permissions[role] = { ...DEFAULT_PERMISSIONS[role] }
    }
  })

  Object.keys(state.permissions || {}).forEach((role) => {
    const perms = state.permissions[role] || {}
    const legacyBeranda = resolveLegacyPermission(perms, 'beranda')
    const legacyTracer = resolveLegacyPermission(perms, 'tracer')
    const legacyAlumni = resolveLegacyPermission(perms, 'alumni')
    const legacyLowongan = resolveLegacyPermission(perms, 'lowongan')
    const legacyUser = resolveLegacyPermission(perms, 'user')

    MENU_PERMISSION_KEYS.forEach((key) => {
      if (typeof perms[key] === 'boolean') return
      switch (key) {
        case 'ikhtisar':
          perms[key] = legacyBeranda ?? true
          break
        case 'kuisioner':
        case 'bankSoal':
          perms[key] = legacyTracer ?? true
          break
        case 'alumni':
          perms[key] = legacyAlumni ?? true
          break
        case 'cta':
        case 'artikel':
        case 'berita':
          perms[key] = legacyBeranda ?? true
          break
        case 'lowongan':
          perms[key] = legacyLowongan ?? true
          break
        case 'user':
          perms[key] = legacyUser ?? true
          break
        default:
          perms[key] = true
      }
    })

    MENU_PERMISSION_KEYS.forEach((key) => {
      if (typeof perms[key] !== 'boolean') perms[key] = true
    })

    EXTRA_PERMISSION_KEYS.forEach((key) => {
      if (typeof perms[key] === 'boolean') return
      perms[key] = !!DEFAULT_PERMISSIONS[role]?.[key]
    })

    state.permissions[role] = perms
  })
}

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      Object.assign(state, parsed)
    }
  } catch (e) {
    // ignore
  }
  if (!state.accessControl || typeof state.accessControl !== 'object') {
    state.accessControl = {
      restrictFacultyMenu: true,
      restrictFacultyBankSoalWrite: true,
    }
  } else {
    if (typeof state.accessControl.restrictFacultyMenu !== 'boolean') {
      state.accessControl.restrictFacultyMenu = true
    }
    if (typeof state.accessControl.restrictFacultyBankSoalWrite !== 'boolean') {
      state.accessControl.restrictFacultyBankSoalWrite = true
    }
  }
  syncMappings()
  ensurePermissionIntegrity()
  if (canUseApi) {
    state.users = Array.isArray(state.users) ? state.users : []
    ensureUserIntegrity()
    return
  }
  if (!Array.isArray(state.users) || !state.users.length) {
    state.users = [...defaultUsers]
  }
  ensureUserIntegrity()
}

load()

const generateId = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString())

export const useUserManagement = () => {
  const fetchUsers = async (params = {}) => {
    state.loading = true
    state.error = ''
    try {
      if (canUseApi) {
        const resp = await userService.getUsers(params)
        const list = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : []
        state.users = list.map((u) => ({
          ...u,
          faculty: u.faculty || u.fakultas || '',
          prodi: u.prodi || u.program || u.programStudi || '',
          fullName: u.fullName || u.name,
          username: u.username || (u.email ? u.email.split('@')[0] : ''),
        }))
        save()
        return
      }
      if (!state.users.length && !canUseApi) {
        state.users = [...defaultUsers]
        save()
      }
    } catch (err) {
      state.error = err?.message || 'Gagal memuat pengguna'
      if (!state.users.length && !canUseApi) {
        state.users = [...defaultUsers]
        save()
      }
    } finally {
      state.loading = false
    }
  }

  const addUser = async (payload) => {
    if (state.users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
      throw new Error('Email sudah terpakai')
    }
    if (canUseApi) {
      const resp = await userService.createUser(payload)
      const user = resp?.data || resp
      if (user) {
        state.users.unshift(user)
        save()
        return user
      }
      throw new Error('Gagal menambah pengguna.')
    }
    const now = new Date().toISOString()
    const passwordToStore =
      payload.password && payload.password.trim() ? payload.password.trim() : DEFAULT_PASSWORD
    const user = {
      id: generateId(),
      name: payload.name,
      fullName: payload.fullName || payload.name,
      email: payload.email,
      username: payload.username || payload.email.split('@')[0] || '',
      phone: payload.phone || '',
      nip: payload.nip || '',
      role: payload.role,
      faculty: payload.faculty || '',
      prodi: payload.prodi || '',
      status: payload.status || 'Aktif',
      password: ensurePasswordHash(passwordToStore, DEFAULT_PASSWORD),
      createdAt: now,
      lastLogin: now,
    }
    state.users.unshift(user)
    save()
    return user
  }

  const updateUser = async (id, payload) => {
    const index = state.users.findIndex((u) => u.id === id)
    if (index === -1) return
    const current = state.users[index]

    if (payload.email && payload.email.toLowerCase() !== current.email.toLowerCase()) {
      const exists = state.users.find(
        (u, idx) => idx !== index && u.email.toLowerCase() === payload.email.toLowerCase(),
      )
      if (exists) {
        throw new Error('Email sudah terpakai')
      }
    }

    if (canUseApi) {
      const resp = await userService.updateUser(id, payload)
      const updated = resp?.data || resp
      state.users[index] = { ...state.users[index], ...updated }
      save()
      return true
    }

    const nextPasswordValue =
      payload.password && payload.password.trim()
        ? payload.password.trim()
        : current.password || DEFAULT_PASSWORD_HASH

    state.users[index] = {
      ...current,
      ...payload,
      fullName: payload.fullName || payload.name || current.fullName || current.name,
      password: ensurePasswordHash(nextPasswordValue, DEFAULT_PASSWORD),
    }
    save()
  }

  const deleteUser = async (id) => {
    const idx = state.users.findIndex((u) => u.id === id)
    if (idx === -1) return
    if (canUseApi) {
      try {
        await userService.deleteUser(id)
      } catch (err) {
        state.error = err?.message || 'Gagal menghapus user'
      }
    }
    state.users.splice(idx, 1)
    save()
  }

  const bulkUpdateStatus = (ids, status) => {
    state.users = state.users.map((u) => (ids.includes(u.id) ? { ...u, status } : u))
    save()
  }

  const bulkAssignRole = (ids, role) => {
    state.users = state.users.map((u) => (ids.includes(u.id) ? { ...u, role } : u))
    save()
  }

  const bulkResetPassword = async (ids) => {
    if (!Array.isArray(ids) || !ids.length) return 0
    if (canUseApi) {
      try {
        await Promise.all(ids.map((id) => userService.resetPassword(id, { password: DEFAULT_PASSWORD })))
      } catch (err) {
        state.error = err?.message || 'Gagal reset password'
      }
    }
    state.users = state.users.map((u) =>
      ids.includes(u.id)
        ? {
            ...u,
            password: DEFAULT_PASSWORD_HASH,
            updatedAt: new Date().toISOString(),
          }
        : u,
    )
    save()
    return ids.length
  }

  const togglePermission = (role, key, value) => {
    state.permissions[role][key] = value
    save()
  }

  const setAccessControl = (key, value) => {
    if (!state.accessControl || typeof state.accessControl !== 'object') {
      state.accessControl = {
        restrictFacultyMenu: true,
        restrictFacultyBankSoalWrite: true,
      }
    }
    state.accessControl[key] = value
    save()
  }

  const assignFacultyAdmin = (facultyName, userId) => {
    const item = state.facultyMapping.find((f) => f.name === facultyName)
    if (item) item.adminId = userId
    save()
  }

  const assignProdiAdmin = (prodiName, userId) => {
    const item = state.prodiMapping.find((p) => p.name === prodiName)
    if (item) item.adminId = userId
    save()
  }

  const addAuditLog = (entry) => {
    state.auditLogs.unshift({
      id: generateId(),
      timestamp: new Date().toISOString(),
      ...entry,
    })
    save()
  }

  const exportUsers = (filtered) => {
    const header = [
      'Nama',
      'Email',
      'Role',
      'Fakultas',
      'Prodi',
      'Status',
      'Tanggal Dibuat',
      'Terakhir Login',
    ]
    const rows = filtered.map((u) => [
      u.name,
      u.email,
      u.role,
      u.faculty,
      u.prodi,
      u.status,
      u.createdAt,
      u.lastLogin,
    ])
    return [header, ...rows]
  }

  return {
    users: computed(() => state.users),
    roles: ROLES,
    faculties: facultiesSample,
    prodis: prodiSample,
    permissions: state.permissions,
    facultyMapping: state.facultyMapping,
    prodiMapping: state.prodiMapping,
    accessControl: computed(() => state.accessControl),
    auditLogs: computed(() => state.auditLogs),
    addUser,
    updateUser,
    deleteUser,
    bulkUpdateStatus,
    bulkAssignRole,
    bulkResetPassword,
    togglePermission,
    setAccessControl,
    assignFacultyAdmin,
    assignProdiAdmin,
    addAuditLog,
    exportUsers,
    fetchUsers,
    loading: computed(() => state.loading),
    error: computed(() => state.error),
  }
}
