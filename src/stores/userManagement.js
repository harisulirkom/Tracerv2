import { computed, reactive } from 'vue'
import userService from '@/services/userService'

const STORAGE_KEY = 'cdc_users_management'
const DEFAULT_PASSWORD = 'admin123'
const canUseApi = !!import.meta.env.VITE_API_BASE_URL

const ROLES = ['Super Admin', 'Admin Universitas', 'Admin Fakultas', 'Admin Prodi']

const facultiesSample = ['Fakultas Sains', 'Fakultas Ekonomi', 'Fakultas Tarbiyah']
const prodiSample = [
  { name: 'Informatika', faculty: 'Fakultas Sains' },
  { name: 'Sistem Informasi', faculty: 'Fakultas Sains' },
  { name: 'Manajemen', faculty: 'Fakultas Ekonomi' },
  { name: 'Akuntansi', faculty: 'Fakultas Ekonomi' },
  { name: 'Pendidikan Agama', faculty: 'Fakultas Tarbiyah' },
]

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
    password: DEFAULT_PASSWORD,
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
    password: DEFAULT_PASSWORD,
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
    faculty: 'Fakultas Ekonomi',
    prodi: '',
    status: 'Aktif',
    password: DEFAULT_PASSWORD,
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
    faculty: 'Fakultas Sains',
    prodi: 'Sistem Informasi',
    status: 'Nonaktif',
    password: DEFAULT_PASSWORD,
    createdAt: '2025-01-08T11:00:00Z',
    lastLogin: '2025-01-09T11:30:00Z',
  },
]

const state = reactive({
  users: [],
  loading: false,
  error: '',
  permissions: {
    'Super Admin': {
      user: true,
      master: true,
      lowongan: true,
      alumni: true,
      tracer: true,
      pelaporan: true,
      kegiatan: true,
      beranda: true,
      lainnya: true,
    },
    'Admin Universitas': {
      user: true,
      master: true,
      lowongan: true,
      alumni: true,
      tracer: true,
      pelaporan: true,
      kegiatan: true,
      beranda: true,
      lainnya: false,
    },
    'Admin Fakultas': {
      user: true,
      master: true,
      lowongan: true,
      alumni: true,
      tracer: true,
      pelaporan: true,
      kegiatan: true,
      beranda: true,
      lainnya: false,
    },
    'Admin Prodi': {
      user: true,
      master: true,
      lowongan: true,
      alumni: true,
      tracer: true,
      pelaporan: false,
      kegiatan: true,
      beranda: true,
      lainnya: false,
    },
  },
  facultyMapping: facultiesSample.map((name) => ({ name, adminId: '' })),
  prodiMapping: prodiSample.map((item) => ({ name: item.name, faculty: item.faculty, adminId: '' })),
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
    password: u.password || DEFAULT_PASSWORD,
    status: u.status || 'Aktif',
    createdAt: u.createdAt || now,
    lastLogin: u.lastLogin || u.createdAt || now,
  }))
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
        if (list.length) {
          state.users = list.map((u) => ({
            ...u,
            fullName: u.fullName || u.name,
            username: u.username || (u.email ? u.email.split('@')[0] : ''),
          }))
          save()
          return
        }
      }
      if (!state.users.length) {
        state.users = [...defaultUsers]
        save()
      }
    } catch (err) {
      state.error = err?.message || 'Gagal memuat pengguna'
      if (!state.users.length) {
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
      try {
        const resp = await userService.createUser(payload)
        const user = resp?.data || resp
        if (user) {
          state.users.unshift(user)
          save()
          return user
        }
      } catch (err) {
        state.error = err?.message || 'Gagal menambah pengguna (fallback lokal)'
      }
    }
    const now = new Date().toISOString()
    const password =
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
      password,
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
      try {
        const resp = await userService.updateUser(id, payload)
        const updated = resp?.data || resp
        state.users[index] = { ...state.users[index], ...updated }
        save()
        return true
      } catch (err) {
        state.error = err?.message || 'Gagal memperbarui user'
      }
    }

    const nextPassword =
      payload.password && payload.password.trim()
        ? payload.password.trim()
        : current.password || DEFAULT_PASSWORD

    state.users[index] = {
      ...current,
      ...payload,
      fullName: payload.fullName || payload.name || current.fullName || current.name,
      password: nextPassword,
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
      ids.includes(u.id) ? { ...u, password: DEFAULT_PASSWORD, updatedAt: new Date().toISOString() } : u,
    )
    save()
    return ids.length
  }

  const togglePermission = (role, key, value) => {
    state.permissions[role][key] = value
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
    auditLogs: computed(() => state.auditLogs),
    addUser,
    updateUser,
    deleteUser,
    bulkUpdateStatus,
    bulkAssignRole,
    bulkResetPassword,
    togglePermission,
    assignFacultyAdmin,
    assignProdiAdmin,
    addAuditLog,
    exportUsers,
    fetchUsers,
    loading: computed(() => state.loading),
    error: computed(() => state.error),
  }
}
