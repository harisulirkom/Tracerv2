<script setup>
import { computed, reactive, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminShell from '../components/AdminShell.vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import { useUserManagement } from '../stores/userManagement'
import { useAuth } from '../stores/auth'

const {
  users,
  roles,
  faculties,
  prodis,
  permissions,
  facultyMapping,
  prodiMapping,
  accessControl,
  auditLogs,
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
  loading,
  error: loadError,
} = useUserManagement()
const auth = useAuth()

const tabs = ['Daftar User', 'Tambah User', 'Role & Akses', 'Mapping Organisasi', 'Import/Export', 'Log Aktivitas', 'Profil Saya']
const activeTab = ref('Daftar User')
const tabContainerRef = ref(null)
const tabRefs = ref([])
const tabIndicator = reactive({ left: 0, top: 0, width: 0, height: 0 })
const route = useRoute()
const router = useRouter()
const tabKeyMap = {
  daftar: 'Daftar User',
  tambah: 'Tambah User',
  role: 'Role & Akses',
  mapping: 'Mapping Organisasi',
  import: 'Import/Export',
  log: 'Log Aktivitas',
  profil: 'Profil Saya',
}
const tabKeyByLabel = Object.entries(tabKeyMap).reduce((acc, [key, label]) => {
  acc[label] = key
  return acc
}, {})
const DEFAULT_TAB_KEY = 'daftar'
const isSuperAdmin = computed(() => (auth.user.value?.role || '') === 'Super Admin')

const searchQuery = ref('')
const filterRole = ref('all')
const filterFaculty = ref('all')
const filterProdi = ref('all')
const filterStatus = ref('all')
const sortField = ref('name')
const sortDir = ref('asc')
const page = ref(1)
const pageSize = ref(10)
const isListLoading = computed(() => loading.value)
const selectedIds = ref([])
const prodiSearch = ref('')

const formatDate = (val) => {
  if (!val) return '-'
  return new Date(val).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

const filteredUsers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return users.value
    .filter((u) => {
      if (filterRole.value !== 'all' && u.role !== filterRole.value) return false
      if (filterFaculty.value !== 'all' && u.faculty !== filterFaculty.value) return false
      if (filterProdi.value !== 'all' && u.prodi !== filterProdi.value) return false
      if (filterStatus.value !== 'all' && u.status !== filterStatus.value) return false
      if (!q) return true
      const haystack = `${u.name} ${u.email} ${u.nip || ''}`.toLowerCase()
      return haystack.includes(q)
    })
    .sort((a, b) => {
      const dir = sortDir.value === 'asc' ? 1 : -1
      if (a[sortField.value] > b[sortField.value]) return dir
      if (a[sortField.value] < b[sortField.value]) return -dir
      return 0
    })
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / pageSize.value)))
const paginatedUsers = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredUsers.value.slice(start, start + pageSize.value)
})

const allVisibleChecked = computed(
  () => paginatedUsers.value.length > 0 && paginatedUsers.value.every((u) => selectedIds.value.includes(u.id)),
)

const toggleSelectAll = () => {
  if (allVisibleChecked.value) {
    selectedIds.value = selectedIds.value.filter((id) => !paginatedUsers.value.some((u) => u.id === id))
  } else {
    const add = paginatedUsers.value.map((u) => u.id)
    selectedIds.value = Array.from(new Set([...selectedIds.value, ...add]))
  }
}

const toggleSort = (field) => {
  if (sortField.value === field) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDir.value = 'asc'
  }
}

const form = reactive({
  id: null,
  name: '',
  email: '',
  phone: '',
  nip: '',
  role: 'Super Admin',
  faculty: '',
  prodi: '',
  status: 'Aktif',
  password: '',
  autoPassword: false,
})
const saving = ref(false)
const message = ref('')
const error = ref('')
const saveNotice = ref({ open: false, title: '', detail: '' })
let saveNoticeTimer = null
const confirmEditOpen = ref(false)
const pendingEditPayload = ref(null)

const resetForm = () => {
  form.id = null
  form.name = ''
  form.email = ''
  form.phone = ''
  form.nip = ''
  form.role = 'Super Admin'
  form.faculty = ''
  form.prodi = ''
  form.status = 'Aktif'
  form.password = ''
  form.autoPassword = false
  message.value = ''
  error.value = ''
  activeTab.value = 'Tambah User'
}

const showSaveNotice = (title, detail) => {
  if (saveNoticeTimer) {
    clearTimeout(saveNoticeTimer)
    saveNoticeTimer = null
  }
  saveNotice.value = { open: true, title, detail }
  saveNoticeTimer = setTimeout(() => {
    saveNotice.value = { open: false, title: '', detail: '' }
  }, 2600)
}

const buildUserPayload = (payload) => {
  const cleaned = { ...payload }
  delete cleaned.autoPassword
  if (!cleaned.password || !String(cleaned.password).trim()) {
    delete cleaned.password
  } else {
    cleaned.password = String(cleaned.password).trim()
  }
  return cleaned
}

const openEditConfirm = () => {
  pendingEditPayload.value = buildUserPayload({ ...form })
  confirmEditOpen.value = true
}

const closeEditConfirm = () => {
  confirmEditOpen.value = false
  pendingEditPayload.value = null
}

const confirmEditSave = async () => {
  if (!pendingEditPayload.value) return
  confirmEditOpen.value = false
  await performSave(pendingEditPayload.value, true)
  pendingEditPayload.value = null
}

const performSave = async (payload, isEdit) => {
  saving.value = true
  message.value = ''
  error.value = ''
  try {
    if (isEdit) {
      await updateUser(payload.id, { ...payload })
      addAuditLog({ user: 'Admin', role: 'Super Admin', unit: 'Universitas', action: 'Update user', target: payload.email })
      message.value = 'User berhasil diperbarui.'
      showSaveNotice('Perubahan tersimpan', `Data ${payload.name || 'user'} berhasil diperbarui.`)
      form.name = payload.name?.trim() || ''
      form.email = payload.email?.trim() || ''
      form.phone = payload.phone?.trim() || ''
      form.nip = payload.nip?.trim() || ''
      form.role = payload.role || form.role
      form.faculty = payload.faculty || ''
      form.prodi = payload.prodi || ''
      form.status = payload.status || form.status
    } else {
      await addUser({ ...payload })
      addAuditLog({ user: 'Admin', role: 'Super Admin', unit: 'Universitas', action: 'Tambah user', target: payload.email })
      message.value = 'User berhasil ditambahkan.'
      showSaveNotice('User tersimpan', `User ${payload.name || 'baru'} berhasil ditambahkan.`)
      resetForm()
    }
  } catch (e) {
    error.value = e.message || 'Gagal menyimpan user.'
  } finally {
    saving.value = false
  }
}

const closeSaveNotice = () => {
  if (saveNoticeTimer) {
    clearTimeout(saveNoticeTimer)
    saveNoticeTimer = null
  }
  saveNotice.value = { open: false, title: '', detail: '' }
}
const validateForm = () => {
  if (!form.name.trim() || !form.email.trim()) {
    throw new Error('Nama dan email wajib diisi.')
  }
  if (['Admin Fakultas', 'Admin Prodi'].includes(form.role) && !form.faculty) {
    throw new Error('Fakultas wajib untuk role ini.')
  }
  if (form.role === 'Admin Prodi' && !form.prodi) {
    throw new Error('Prodi wajib untuk role Admin Prodi.')
  }
}

const handleSubmit = async () => {
  try {
    validateForm()
    if (form.id) {
      openEditConfirm()
      return
    }
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm('Apakah Anda yakin menyimpan?')
    if (!confirmed) return
    await performSave(buildUserPayload({ ...form }), false)
  } catch (e) {
    error.value = e.message || 'Gagal menyimpan user.'
  }
}

const handleEdit = (item) => {
  activeTab.value = 'Tambah User'
  form.id = item.id
  form.name = item.name
  form.email = item.email
  form.phone = item.phone
  form.nip = item.nip
  form.role = item.role
  form.faculty = item.faculty
  form.prodi = item.prodi
  form.status = item.status
  form.password = ''
  form.autoPassword = false
}

const handleDelete = async (id) => {
  const confirmed = window.confirm('Hapus user ini?')
  if (!confirmed) return
  await deleteUser(id)
  selectedIds.value = selectedIds.value.filter((x) => x !== id)
}

const doBulkStatus = (status) => {
  if (!selectedIds.value.length) return
  bulkUpdateStatus(selectedIds.value, status)
  addAuditLog({ user: 'Admin', role: 'Super Admin', unit: 'Universitas', action: `Bulk ${status}`, target: `${selectedIds.value.length} user` })
  selectedIds.value = []
}

const doBulkRole = (role) => {
  if (!selectedIds.value.length) return
  bulkAssignRole(selectedIds.value, role)
  addAuditLog({ user: 'Admin', role: 'Super Admin', unit: 'Universitas', action: `Bulk set role ${role}`, target: `${selectedIds.value.length} user` })
  selectedIds.value = []
}

const doBulkReset = async () => {
  if (!selectedIds.value.length) return
  await bulkResetPassword(selectedIds.value)
  addAuditLog({ user: 'Admin', role: 'Super Admin', unit: 'Universitas', action: 'Bulk reset password', target: `${selectedIds.value.length} user` })
}

const availableProdis = computed(() => {
  if (!form.faculty) return prodis
  return prodis.filter((p) => p.faculty === form.faculty)
})

const filteredProdiMapping = computed(() => {
  const q = prodiSearch.value.trim().toLowerCase()
  if (!q) return prodiMapping
  return prodiMapping.filter(
    (p) => p.name.toLowerCase().includes(q) || p.faculty.toLowerCase().includes(q),
  )
})

const setTabRef = (el, index) => {
  if (el) tabRefs.value[index] = el
}

const updateTabIndicator = () => {
  nextTick(() => {
    const index = tabs.indexOf(activeTab.value)
    const tabEl = tabRefs.value[index]
    if (!tabContainerRef.value || !tabEl) return
    const containerRect = tabContainerRef.value.getBoundingClientRect()
    const tabRect = tabEl.getBoundingClientRect()
    tabIndicator.left = tabRect.left - containerRect.left
    tabIndicator.top = tabRect.top - containerRect.top
    tabIndicator.width = tabRect.width
    tabIndicator.height = tabRect.height
  })
}

watch(
  () => form.faculty,
  (next) => {
    if (!next) return
    if (!form.prodi) return
    const exists = availableProdis.value.some((p) => p.name === form.prodi)
    if (!exists) {
      form.prodi = ''
    }
  },
)

watch(
  () => route.query?.tab,
  (next) => {
    const key = String(next || '').toLowerCase()
    const resolved = tabKeyMap[key]
    if (resolved && resolved !== activeTab.value) {
      activeTab.value = resolved
    }
  },
  { immediate: true },
)

watch(
  () => activeTab.value,
  (next) => {
    if (next === 'Role & Akses') {
      loadRoleAccessDraft()
    }
    updateTabIndicator()
    const nextKey = tabKeyByLabel[next] || DEFAULT_TAB_KEY
    const currentKey = String(route.query?.tab || '').toLowerCase()
    if (nextKey === DEFAULT_TAB_KEY && !currentKey) return
    if (currentKey === nextKey) return
    const nextQuery = { ...route.query }
    if (nextKey === DEFAULT_TAB_KEY) {
      delete nextQuery.tab
    } else {
      nextQuery.tab = nextKey
    }
    router.replace({ path: route.path, query: nextQuery })
  },
)

const selectedUser = ref(null)
const openDetail = (item) => {
  selectedUser.value = item
}
const closeDetail = () => {
  selectedUser.value = null
}

const permissionModules = [
  { key: 'ikhtisar', label: 'Ikhtisar', type: 'permission' },
  { key: 'kuisioner', label: 'Kelola kuisioner', type: 'permission' },
  { key: 'alumni', label: 'Daftar alumni', type: 'permission' },
  { key: 'alumniEdit', label: 'Edit data alumni', type: 'permission' },
  { key: 'bankSoal', label: 'Bank soal', type: 'permission' },
  { key: 'cta', label: 'CTA Slider', type: 'permission' },
  { key: 'lowongan', label: 'Kelola lowongan', type: 'permission' },
  { key: 'artikel', label: 'Artikel & tips', type: 'permission' },
  { key: 'user', label: 'User', type: 'permission' },
  { key: 'berita', label: 'Berita', type: 'permission' },
  { key: 'faculty-menu', label: 'Batasi menu admin fakultas/prodi', type: 'access', accessKey: 'restrictFacultyMenu' },
  { key: 'faculty-bank', label: 'Bank soal hanya baca (fakultas/prodi)', type: 'access', accessKey: 'restrictFacultyBankSoalWrite' },
]

const permissionDraft = reactive({})
const accessDraft = reactive({
  restrictFacultyMenu: true,
  restrictFacultyBankSoalWrite: true,
})
const permissionKeys = permissionModules.filter((mod) => mod.type === 'permission').map((mod) => mod.key)

const loadRoleAccessDraft = () => {
  roles.forEach((role) => {
    permissionDraft[role] = {
      ...(permissions[role] || {}),
    }
    permissionKeys.forEach((key) => {
      if (typeof permissionDraft[role][key] !== 'boolean') {
        permissionDraft[role][key] = !!permissions[role]?.[key]
      }
    })
  })
  accessDraft.restrictFacultyMenu = accessControl.value?.restrictFacultyMenu ?? true
  accessDraft.restrictFacultyBankSoalWrite = accessControl.value?.restrictFacultyBankSoalWrite ?? true
}

const updatePermissionDraft = (role, key, value) => {
  if (!permissionDraft[role]) permissionDraft[role] = {}
  permissionDraft[role][key] = value
}

const updateAccessDraft = (key, value) => {
  accessDraft[key] = value
}

const handlePermissionToggle = (role, key) => {
  if (role === 'Super Admin') return
  const next = !permissionDraft[role]?.[key]
  updatePermissionDraft(role, key, next)
  togglePermission(role, key, next)
}

const handleAccessToggle = (key) => {
  if (!isSuperAdmin.value) return
  const next = !accessDraft[key]
  updateAccessDraft(key, next)
  setAccessControl(key, next)
}

const selectedFacultyAdmin = ref({})
const selectedProdiAdmin = ref({})

onMounted(() => {
  fetchUsers()
  if (activeTab.value === 'Role & Akses') {
    loadRoleAccessDraft()
  }
  updateTabIndicator()
  window.addEventListener('resize', updateTabIndicator)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateTabIndicator)
})

const saveFacultyMapping = () => {
  // eslint-disable-next-line no-alert
  const confirmed = window.confirm('Apakah Anda yakin menyimpan?')
  if (!confirmed) return
  facultyMapping.forEach((f) => {
    if (selectedFacultyAdmin.value[f.name]) {
      assignFacultyAdmin(f.name, selectedFacultyAdmin.value[f.name])
    }
  })
}

const saveProdiMapping = () => {
  // eslint-disable-next-line no-alert
  const confirmed = window.confirm('Apakah Anda yakin menyimpan?')
  if (!confirmed) return
  prodiMapping.forEach((p) => {
    if (selectedProdiAdmin.value[p.name]) {
      assignProdiAdmin(p.name, selectedProdiAdmin.value[p.name])
    }
  })
}

const importResult = ref({ success: [], failed: [] })
const selectedFileName = ref('')

const handleImport = () => {
  importResult.value = {
    success: [{ email: 'sample@demo.com', reason: 'Ok' }],
    failed: [{ email: 'duplikat@demo.com', reason: 'Email duplikat' }],
  }
}

const downloadTemplate = () => {
  const header = ['Nama', 'Email', 'Role', 'Fakultas', 'Prodi', 'Status']
  const blob = new Blob([header.join(',')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'template_user.csv'
  link.click()
  URL.revokeObjectURL(url)
}

const exportCsv = () => {
  const csvRows = exportUsers(filteredUsers.value).map((row) =>
    row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','),
  )
  const blob = new Blob([csvRows.join("`n")], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'users_export.csv'
  link.click()
  URL.revokeObjectURL(url)
}

const profileForm = reactive({
  name: 'Rita Rahmania',
  email: 'admin@tracer.local',
  phone: '081234567890',
  faculty: '',
  prodi: '',
  password: '',
})

const handleProfileSave = () => {
  // eslint-disable-next-line no-alert
  window.confirm('Apakah Anda yakin menyimpan?')
}
</script>

<template>
  <AdminShell>
    <div class="max-w-6xl px-4 py-6 sm:px-6 lg:px-10">
      <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">User</p>
          <h1 class="mt-1 text-2xl font-semibold text-slate-900">Pengelolaan User & Role</h1>
          <p class="text-xs text-slate-500">
            Kelola user multi level (Super Admin, Universitas, Fakultas, Prodi), hak akses, mapping unit, dan audit.
          </p>
        </div>
      </header>

      <div
        ref="tabContainerRef"
        class="relative mb-4 inline-flex flex-wrap items-center gap-1 rounded-full bg-slate-100/80 p-1 text-xs font-semibold shadow-sm shadow-slate-200/70"
      >
        <span
          aria-hidden="true"
          class="pointer-events-none absolute left-0 top-0 rounded-full bg-white shadow-sm ring-1 ring-slate-200 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          :style="{
            width: tabIndicator.width + 'px',
            height: tabIndicator.height + 'px',
            transform: `translate(${tabIndicator.left}px, ${tabIndicator.top}px)`,
            opacity: tabIndicator.width ? 0.95 : 0,
            filter: tabIndicator.width ? 'blur(0.4px)' : 'blur(0px)',
          }"
        ></span>
        <button
          v-for="(tab, index) in tabs"
          :key="tab"
          :ref="(el) => setTabRef(el, index)"
          type="button"
          class="relative z-10 rounded-full px-3 py-1.5 transition-colors duration-200 ease-out"
          :class="activeTab === tab ? 'text-slate-900' : 'text-slate-500 hover:bg-white/60 hover:text-slate-900'"
          @click="activeTab = tab"
        >
          {{ tab }}
        </button>
      </div>

      <section v-if="activeTab === 'Daftar User'" class="space-y-4 rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                class="w-48 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 pr-7 text-xs text-slate-700 outline-none ring-0 transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                placeholder="Cari nama/email/NIP"
              />
              <span class="pointer-events-none absolute right-2 top-1.5 text-[11px] text-slate-400">⌕</span>
            </div>
            <select v-model="filterRole" class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
              <option value="all">Role: semua</option>
              <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
            </select>
            <select v-model="filterFaculty" class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
              <option value="all">Fakultas: semua</option>
              <option v-for="f in faculties" :key="f" :value="f">{{ f }}</option>
            </select>
            <select v-model="filterProdi" class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
              <option value="all">Prodi: semua</option>
              <option v-for="p in prodis" :key="p.name" :value="p.name">{{ p.name }}</option>
            </select>
            <select v-model="filterStatus" class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
              <option value="all">Status: semua</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>
          <div class="flex flex-wrap gap-2 text-xs font-semibold">
            <button
              type="button"
              class="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700 transition hover:bg-slate-50"
              @click="doBulkStatus('Aktif')"
            >
              Aktifkan
            </button>
            <button
              type="button"
              class="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700 transition hover:bg-amber-100"
              @click="doBulkStatus('Nonaktif')"
            >
              Nonaktifkan
            </button>
            <select
              class="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700"
              @change="(e) => e.target.value && doBulkRole(e.target.value)"
            >
              <option value="">Role massal</option>
              <option v-for="r in roles" :key="`bulk-${r}`" :value="r">{{ r }}</option>
            </select>
            <button
              type="button"
              class="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-indigo-700 transition hover:bg-indigo-100"
              @click="doBulkReset"
            >
              Reset password
            </button>
            <button
              type="button"
              class="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700 transition hover:bg-slate-50"
              @click="exportCsv"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div class="overflow-x-auto rounded-2xl border border-slate-100">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th class="px-3 py-2">
                  <input type="checkbox" :checked="allVisibleChecked" @change="toggleSelectAll" />
                </th>
                <th class="px-3 py-2 text-left cursor-pointer" @click="toggleSort('name')">Nama</th>
                <th class="px-3 py-2 text-left cursor-pointer" @click="toggleSort('email')">Email/Username</th>
                <th class="px-3 py-2 text-left">Role</th>
                <th class="px-3 py-2 text-left">Unit/Fakultas/Prodi</th>
                <th class="px-3 py-2 text-left">Status</th>
                <th class="px-3 py-2 text-left cursor-pointer" @click="toggleSort('createdAt')">Tanggal Dibuat</th>
                <th class="px-3 py-2 text-left cursor-pointer" @click="toggleSort('lastLogin')">Terakhir Login</th>
                <th class="px-3 py-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="u in paginatedUsers" :key="u.id">
                <td class="px-3 py-2">
                  <input
                    type="checkbox"
                    :checked="selectedIds.includes(u.id)"
                    @change="
                      () => {
                        if (selectedIds.includes(u.id)) selectedIds = selectedIds.filter((x) => x !== u.id)
                        else selectedIds.push(u.id)
                      }
                    "
                  />
                </td>
                <td class="px-3 py-2 font-semibold text-slate-900">{{ u.name }}</td>
                <td class="px-3 py-2 text-slate-700">{{ u.email }}</td>
                <td class="px-3 py-2">{{ u.role }}</td>
                <td class="px-3 py-2 text-xs text-slate-600">
                  <div>{{ u.faculty || '-' }}</div>
                  <div v-if="u.prodi">{{ u.prodi }}</div>
                </td>
                <td class="px-3 py-2">
                  <span
                    class="rounded-full px-2 py-1 text-[11px] font-semibold"
                    :class="u.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'"
                  >
                    {{ u.status }}
                  </span>
                </td>
                <td class="px-3 py-2 text-xs text-slate-600">{{ formatDate(u.createdAt) }}</td>
                <td class="px-3 py-2 text-xs text-slate-600">{{ formatDate(u.lastLogin) }}</td>
                <td class="px-3 py-2 text-xs font-semibold text-indigo-600">
                  <button class="mr-2 hover:text-indigo-500" type="button" @click="openDetail(u)">Lihat</button>
                  <button class="mr-2 hover:text-indigo-500" type="button" @click="handleEdit(u)">Edit</button>
                  <button class="mr-2 hover:text-indigo-500" type="button" @click="doBulkReset">Reset PW</button>
                  <button
                    class="mr-2 text-amber-600 hover:text-amber-500"
                    type="button"
                    @click="bulkUpdateStatus([u.id], u.status === 'Aktif' ? 'Nonaktif' : 'Aktif')"
                  >
                    {{ u.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan' }}
                  </button>
                  <button class="text-rose-600 hover:text-rose-500" type="button" @click="handleDelete(u.id)">Hapus</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex items-center justify-between text-xs text-slate-600">
          <div>Halaman {{ page }} / {{ totalPages }}</div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-full border border-slate-200 px-3 py-1"
              :disabled="page === 1"
              @click="page = Math.max(1, page - 1)"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              class="rounded-full border border-slate-200 px-3 py-1"
              :disabled="page === totalPages"
              @click="page = Math.min(totalPages, page + 1)"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </section>
      <section v-if="activeTab === 'Tambah User'" class="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              {{ form.id ? 'Edit user' : 'Tambah user' }}
            </p>
            <h2 class="text-lg font-semibold text-slate-900">{{ form.id ? 'Perbarui data' : 'Form user' }}</h2>
          </div>
          <button
            type="button"
            class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-700"
            @click="resetForm"
          >
            Reset
          </button>
        </div>

        <form class="mt-4 space-y-3 text-sm" @submit.prevent="handleSubmit">
          <div class="grid gap-3 md:grid-cols-2">
            <label class="space-y-1">
              <span class="text-xs font-semibold text-slate-600">Nama lengkap</span>
              <input v-model="form.name" type="text" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100" required />
            </label>
            <label class="space-y-1">
              <span class="text-xs font-semibold text-slate-600">Email/Username</span>
              <input v-model="form.email" type="email" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100" required />
            </label>
          </div>
          <div class="grid gap-3 md:grid-cols-2">
            <label class="space-y-1">
              <span class="text-xs font-semibold text-slate-600">Nomor HP (opsional)</span>
              <input v-model="form.phone" type="text" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
            </label>
            <label class="space-y-1">
              <span class="text-xs font-semibold text-slate-600">NIP/NIDN (opsional)</span>
              <input v-model="form.nip" type="text" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
            </label>
          </div>

          <div class="grid gap-3 md:grid-cols-3">
            <label class="space-y-1">
              <span class="text-xs font-semibold text-slate-600">Role</span>
              <select v-model="form.role" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100">
                <option v-for="r in roles" :key="`role-${r}`" :value="r">{{ r }}</option>
              </select>
            </label>
            <label class="space-y-1">
              <span class="text-xs font-semibold text-slate-600">Fakultas</span>
              <select
                v-model="form.faculty"
                :disabled="!['Admin Fakultas', 'Admin Prodi'].includes(form.role)"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition disabled:opacity-50 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Pilih fakultas</option>
                <option v-for="f in faculties" :key="`fac-${f}`" :value="f">{{ f }}</option>
              </select>
            </label>
            <label class="space-y-1">
              <span class="text-xs font-semibold text-slate-600">Prodi</span>
              <select
                v-model="form.prodi"
                :disabled="form.role !== 'Admin Prodi'"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition disabled:opacity-50 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Pilih prodi</option>
                <option v-for="p in availableProdis" :key="`pro-${p.name}`" :value="p.name">{{ p.name }}</option>
              </select>
            </label>
          </div>

          <div class="grid gap-3 md:grid-cols-3">
            <label class="space-y-1">
              <span class="text-xs font-semibold text-slate-600">Status</span>
              <select v-model="form.status" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100">
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </label>
            <label class="space-y-1 md:col-span-2">
              <span class="text-xs font-semibold text-slate-600">Password</span>
              <div class="flex gap-2">
                <input
                  v-model="form.password"
                  :disabled="form.autoPassword"
                  type="password"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition disabled:opacity-50 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  placeholder="Set manual"
                />
                <label class="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                  <input v-model="form.autoPassword" type="checkbox" />
                  Generate otomatis & kirim email
                </label>
              </div>
            </label>
          </div>

          <div class="space-y-2">
            <p v-if="message" class="rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
              {{ message }}
            </p>
            <p v-if="error" class="rounded-2xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
              {{ error }}
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="submit"
              class="rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:brightness-110"
              :disabled="saving"
            >
              {{ saving ? 'Menyimpan...' : form.id ? 'Simpan perubahan' : 'Tambahkan user' }}
            </button>
            <button
              type="button"
              class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              @click="resetForm"
            >
              Bersihkan
            </button>
          </div>
        </form>
      </section>

      <section v-if="activeTab === 'Role & Akses'" class="space-y-4 rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Role Permission Matrix</p>
            <h2 class="text-lg font-semibold text-slate-900">Atur izin per role</h2>
          </div>
          <p class="text-[11px] text-slate-500">Super Admin otomatis akses penuh.</p>
        </div>
        <div class="overflow-x-auto rounded-2xl border border-slate-100">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th class="px-4 py-2 text-left">Modul</th>
                <th v-for="role in roles" :key="`role-head-${role}`" class="px-4 py-2 text-left">{{ role }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="mod in permissionModules" :key="mod.key">
                <td class="px-4 py-2 text-slate-700">{{ mod.label }}</td>
                <td v-for="role in roles" :key="`role-${role}-${mod.key}`" class="px-4 py-2">
                  <button
                    v-if="mod.type === 'permission'"
                    type="button"
                    role="switch"
                    class="relative flex h-5 w-8 shrink-0 items-center justify-start rounded-full border border-transparent px-px shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-emerald-200/60 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-emerald-500 data-[state=checked]:justify-end data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80"
                    :data-state="permissionDraft[role]?.[mod.key] ? 'checked' : 'unchecked'"
                    :aria-checked="permissionDraft[role]?.[mod.key]"
                    :disabled="role === 'Super Admin'"
                    @click="handlePermissionToggle(role, mod.key)"
                  >
                    <span
                      class="pointer-events-none relative z-10 block size-4 rounded-full bg-background ring-0 dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground"
                      :data-state="permissionDraft[role]?.[mod.key] ? 'checked' : 'unchecked'"
                    />
                  </button>
                  <button
                    v-else
                    type="button"
                    role="switch"
                    class="relative flex h-5 w-8 shrink-0 items-center justify-start rounded-full border border-transparent px-px shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-emerald-200/60 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-emerald-500 data-[state=checked]:justify-end data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80"
                    :data-state="accessDraft[mod.accessKey] ? 'checked' : 'unchecked'"
                    :aria-checked="accessDraft[mod.accessKey]"
                    :disabled="!isSuperAdmin"
                    @click="handleAccessToggle(mod.accessKey)"
                  >
                    <span
                      class="pointer-events-none relative z-10 block size-4 rounded-full bg-background ring-0 dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground"
                      :data-state="accessDraft[mod.accessKey] ? 'checked' : 'unchecked'"
                    />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-xs text-slate-500">
          Atur menu yang tampil per role. Super Admin tetap memiliki akses penuh untuk semua menu.
        </p>
        <p v-if="!isSuperAdmin" class="text-[11px] font-semibold text-amber-600">
          Kontrol pembatasan admin fakultas hanya bisa diubah oleh Super Admin.
        </p>
      </section>
      <section v-if="activeTab === 'Mapping Organisasi'" class="space-y-4 rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Mapping Fakultas</p>
          <div class="overflow-x-auto rounded-2xl border border-slate-100">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th class="px-4 py-2 text-left">Fakultas</th>
                  <th class="px-4 py-2 text-left">Admin Fakultas</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="f in facultyMapping" :key="f.name">
                  <td class="px-4 py-2">{{ f.name }}</td>
                  <td class="px-4 py-2">
                    <select
                      v-model="selectedFacultyAdmin[f.name]"
                      class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">Pilih user</option>
                      <option
                        v-for="u in users.filter((u) => u.role === 'Admin Fakultas')"
                        :key="`fac-admin-${u.id}`"
                        :value="u.id"
                      >
                        {{ u.name }} ({{ u.email }})
                      </option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mt-2 flex justify-end">
            <button
              type="button"
              class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              @click="saveFacultyMapping"
            >
              Simpan mapping fakultas
            </button>
          </div>
        </div>

        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Mapping Prodi</p>
          <div class="mt-2 flex items-center gap-2 text-[11px] text-slate-600">
            <div class="relative">
              <input
                v-model="prodiSearch"
                type="text"
                class="w-64 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 pr-7 text-xs text-slate-700 outline-none ring-0 transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                placeholder="Cari prodi/fakultas..."
              />
              <span class="pointer-events-none absolute right-2 top-1.5 text-[11px] text-slate-400">?</span>
            </div>
            <span>{{ filteredProdiMapping.length }} prodi</span>
          </div>
          <div class="overflow-x-auto rounded-2xl border border-slate-100">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th class="px-4 py-2 text-left">Prodi</th>
                  <th class="px-4 py-2 text-left">Fakultas</th>
                  <th class="px-4 py-2 text-left">Admin Prodi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="p in filteredProdiMapping" :key="p.name">
                  <td class="px-4 py-2">{{ p.name }}</td>
                  <td class="px-4 py-2 text-slate-600">{{ p.faculty }}</td>
                  <td class="px-4 py-2">
                    <select
                      v-model="selectedProdiAdmin[p.name]"
                      class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">Pilih user</option>
                      <option
                        v-for="u in users.filter((u) => u.role === 'Admin Prodi')"
                        :key="`prodi-admin-${u.id}`"
                        :value="u.id"
                      >
                        {{ u.name }} ({{ u.email }})
                      </option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mt-2 flex justify-end gap-2 text-[11px] text-amber-600">
            <span>Validasi otomatis role sesuai unit.</span>
            <button
              type="button"
              class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              @click="saveProdiMapping"
            >
              Simpan mapping prodi
            </button>
          </div>
        </div>
      </section>
      <section v-if="activeTab === 'Import/Export'" class="space-y-4 rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70">
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Import user</p>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                class="w-full text-xs"
                @change="(e) => {
                  selectedFileName = e.target.files?.[0]?.name || ''
                }"
              />
              <p class="mt-1 text-xs text-slate-500">Template: Nama, Email, Role, Fakultas, Prodi, Status.</p>
              <div class="mt-2 flex gap-2 text-xs font-semibold">
                <button
                  type="button"
                  class="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 transition hover:bg-slate-50"
                  @click="downloadTemplate"
                >
                  Download template
                </button>
                <button
                  type="button"
                  class="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-indigo-700 transition hover:bg-indigo-100"
                  @click="handleImport"
                >
                  Preview & import
                </button>
              </div>
              <p v-if="selectedFileName" class="mt-2 text-xs text-slate-600">File: {{ selectedFileName }}</p>
              <div v-if="importResult.success.length || importResult.failed.length" class="mt-3 space-y-2 text-xs">
                <p class="text-emerald-600">Berhasil: {{ importResult.success.length }}</p>
                <p class="text-rose-600">Gagal: {{ importResult.failed.length }} (cek kolom wajib / role / unit)</p>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Export user</p>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p class="text-xs text-slate-600">Export berdasarkan filter aktif, pilih format:</p>
              <div class="mt-2 flex gap-2 text-xs font-semibold">
                <button
                  type="button"
                  class="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 transition hover:bg-slate-50"
                  @click="exportCsv"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  class="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 transition hover:bg-slate-50"
                  disabled
                  title="Excel mock"
                >
                  Export Excel
                </button>
              </div>
              <p class="mt-2 text-xs text-slate-500">Kolom: nama, email, role, fakultas, prodi, status, dibuat, login.</p>
            </div>
          </div>
        </div>
      </section>

      <section v-if="activeTab === 'Log Aktivitas'" class="space-y-4 rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Audit trail</p>
            <h2 class="text-lg font-semibold text-slate-900">Log aktivitas user</h2>
          </div>
          <p class="text-[11px] text-slate-500">Filter: user, aksi, tanggal, unit (belum interaktif).</p>
        </div>
        <div class="overflow-x-auto rounded-2xl border border-slate-100">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th class="px-4 py-2 text-left">Tanggal & Waktu</th>
                <th class="px-4 py-2 text-left">User</th>
                <th class="px-4 py-2 text-left">Role</th>
                <th class="px-4 py-2 text-left">Unit</th>
                <th class="px-4 py-2 text-left">Aksi</th>
                <th class="px-4 py-2 text-left">Target</th>
                <th class="px-4 py-2 text-left">IP</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="log in auditLogs" :key="log.id">
                <td class="px-4 py-2 text-xs text-slate-600">{{ formatDate(log.timestamp) }}</td>
                <td class="px-4 py-2">{{ log.user }}</td>
                <td class="px-4 py-2 text-xs">{{ log.role }}</td>
                <td class="px-4 py-2 text-xs">{{ log.unit }}</td>
                <td class="px-4 py-2 text-xs">{{ log.action }}</td>
                <td class="px-4 py-2 text-xs">{{ log.target }}</td>
                <td class="px-4 py-2 text-xs">{{ log.ip || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="activeTab === 'Profil Saya'" class="space-y-4 rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/70">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">Profil</p>
          <h2 class="text-lg font-semibold text-slate-900">Profil Saya</h2>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <label class="space-y-1 text-sm">
            <span class="text-xs font-semibold text-slate-600">Nama</span>
            <input
              v-model="profileForm.name"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <label class="space-y-1 text-sm">
            <span class="text-xs font-semibold text-slate-600">Email</span>
            <input
              v-model="profileForm.email"
              type="email"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <label class="space-y-1 text-sm">
            <span class="text-xs font-semibold text-slate-600">Nomor HP</span>
            <input
              v-model="profileForm.phone"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <div class="space-y-1 text-sm">
            <span class="text-xs font-semibold text-slate-600">Fakultas / Prodi</span>
            <p class="rounded-2xl bg-slate-50 px-3 py-2 text-slate-700">Readonly kecuali role fakultas/prodi.</p>
          </div>
          <label class="space-y-1 text-sm">
            <span class="text-xs font-semibold text-slate-600">Ganti password</span>
            <input
              v-model="profileForm.password"
              type="password"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="Isi jika ingin mengganti"
            />
          </label>
        </div>
        <div class="flex gap-2 text-xs font-semibold">
          <button
            type="button"
            class="rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 px-5 py-2 text-white shadow-lg shadow-indigo-500/20 transition hover:brightness-110"
            @click="handleProfileSave"
          >
            Simpan profil
          </button>
          <button
            type="button"
            class="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 transition hover:bg-slate-50"
          >
            Batalkan
          </button>
        </div>
      </section>
    </div>

    <div
      v-if="selectedUser"
      class="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-4 sm:items-center"
      @click.self="closeDetail"
    >
      <div class="relative w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8" style="max-height: 90vh">
        <button
          type="button"
          class="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          @click="closeDetail"
        >
          ✕
        </button>
        <div class="space-y-3">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">Detail User</p>
          <h3 class="text-2xl font-semibold text-slate-900">{{ selectedUser.name }}</h3>
          <div class="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
            <p><span class="font-semibold text-slate-800">Email:</span> {{ selectedUser.email }}</p>
            <p><span class="font-semibold text-slate-800">Role:</span> {{ selectedUser.role }}</p>
            <p><span class="font-semibold text-slate-800">Fakultas:</span> {{ selectedUser.faculty || '-' }}</p>
            <p><span class="font-semibold text-slate-800">Prodi:</span> {{ selectedUser.prodi || '-' }}</p>
            <p><span class="font-semibold text-slate-800">Status:</span> {{ selectedUser.status }}</p>
            <p><span class="font-semibold text-slate-800">NIP/NIDN:</span> {{ selectedUser.nip || '-' }}</p>
            <p><span class="font-semibold text-slate-800">Created:</span> {{ formatDate(selectedUser.createdAt) }}</p>
            <p><span class="font-semibold text-slate-800">Last login:</span> {{ formatDate(selectedUser.lastLogin) }}</p>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="confirmEditOpen"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/20">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600">Konfirmasi</p>
            <h3 class="text-lg font-semibold text-slate-900">Apakah Anda yakin merubah data?</h3>
            <p class="mt-2 text-sm text-slate-600">
              Perubahan akan memperbarui data user di sistem. Pastikan sudah sesuai.
            </p>
          </div>
          <button
            type="button"
            class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            @click="closeEditConfirm"
          >
            Tutup
          </button>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition btn-white-gradient-hover"
            @click="closeEditConfirm"
          >
            Batal
          </button>
          <button
            type="button"
            class="rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110"
            @click="confirmEditSave"
          >
            Ya, simpan
          </button>
        </div>
      </div>
    </div>
    <div
      v-if="saveNotice.open"
      class="fixed right-5 top-5 z-[60] w-full max-w-xs rounded-3xl border border-emerald-100 bg-white p-4 text-sm shadow-xl shadow-emerald-500/10"
      role="status"
      aria-live="polite"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">{{ saveNotice.title }}</p>
          <p class="mt-1 text-sm font-semibold text-slate-900">{{ saveNotice.detail }}</p>
        </div>
        <button
          type="button"
          class="rounded-full border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
          @click="closeSaveNotice"
        >
          Tutup
        </button>
      </div>
    </div>
  </AdminShell>
  <LoadingOverlay :active="loading" />
</template>
