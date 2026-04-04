<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'
import { useDashboardData } from '../stores/dashboard'
import { useUserManagement } from '../stores/userManagement'

const router = useRouter()
const auth = useAuth()
const { dashboard } = useDashboardData()
const { accessControl, permissions } = useUserManagement()
const showLogoutDialog = ref(false)

const adminNav = [
  { label: 'Ikhtisar', route: '/admin', icon: 'overview', permissionKey: 'ikhtisar' },
  { label: 'Kuisioner', route: '/admin/kuisioner', icon: 'kuisioner', permissionKey: 'kuisioner' },
  { label: 'Akreditasi tracer', route: '/admin/tracer-akreditasi', icon: 'akreditasi', permissionKey: 'kuisioner' },
  { label: 'Daftar alumni', route: '/admin/alumni', icon: 'alumni', permissionKey: 'alumni' },
  { label: 'Bank soal', route: '/admin/bank-soal', icon: 'bank', permissionKey: 'bankSoal' },
  { label: 'CTA Slider', route: '/admin/cta', icon: 'cta', permissionKey: 'cta' },
  { label: 'Kelola lowongan', route: '/admin/lowongan', icon: 'lowongan', permissionKey: 'lowongan' },
  { label: 'Artikel & tips', route: '/admin/artikel', icon: 'artikel', permissionKey: 'artikel' },
  {
    label: 'User',
    route: '/admin/user',
    icon: 'user',
    permissionKey: 'user',
    children: [
      { label: 'Tambah user', route: { path: '/admin/user', query: { tab: 'tambah' } }, permissionKey: 'user' },
      { label: 'Role & Akses', route: { path: '/admin/user', query: { tab: 'role' } }, permissionKey: 'user' },
      { label: 'Mapping Organisasi', route: { path: '/admin/user', query: { tab: 'mapping' } }, permissionKey: 'user' },
      { label: 'Import/Export', route: { path: '/admin/user', query: { tab: 'import' } }, permissionKey: 'user' },
      { label: 'Log Aktivitas', route: { path: '/admin/user', query: { tab: 'log' } }, permissionKey: 'user' },
    ],
  },
  { label: 'Berita', route: '/admin/berita', icon: 'berita', permissionKey: 'berita' },
]

const normalizeRole = (role) => String(role || '').trim().toLowerCase()
const extractRoleLabel = (role) => {
  if (role && typeof role === 'object') {
    return (
      role.role_name ||
      role.roleName ||
      role.role_id ||
      role.roleId ||
      role.name ||
      role.label ||
      role.title ||
      role.role ||
      role.nama ||
      role.id ||
      ''
    )
  }
  return role
}
const ROLE_ID_MAP = {
  1: 'Super Admin',
  2: 'Admin Universitas',
  3: 'Admin Fakultas',
  4: 'Admin Prodi',
}
const ROLE_MAP = {
  'super admin': 'Super Admin',
  'superadmin': 'Super Admin',
  admin: 'Admin Universitas',
  'admin universitas': 'Admin Universitas',
  'admin fakultas': 'Admin Fakultas',
  'admin prodi': 'Admin Prodi',
  'admin program studi': 'Admin Prodi',
}
const resolveRoleKey = (role) => {
  const extracted = extractRoleLabel(role)
  const extractedNumber =
    typeof extracted === 'number'
      ? extracted
      : typeof extracted === 'string' && extracted.trim() && !Number.isNaN(Number(extracted))
        ? Number(extracted)
        : null
  if (extractedNumber !== null) {
    return ROLE_ID_MAP[extractedNumber] || String(extractedNumber)
  }
  const normalized = normalizeRole(extracted)
  return ROLE_MAP[normalized] || (extracted ? String(extracted).trim() : '')
}
const currentRoleKey = computed(() => resolveRoleKey(auth.user.value?.role))
const normalizedRole = computed(() => normalizeRole(currentRoleKey.value))
const isFacultyAdmin = computed(() => normalizedRole.value === 'admin fakultas')
const isProdiAdmin = computed(() => normalizedRole.value === 'admin prodi')
const isSuperAdmin = computed(() => normalizedRole.value === 'super admin')
const restrictFacultyMenu = computed(
  () => accessControl.value?.restrictFacultyMenu ?? true,
)
const rolePermissions = computed(() => permissions[currentRoleKey.value] || {})
const hasNavAccess = (item) => {
  if (isSuperAdmin.value) return true
  if (!item.permissionKey) return true
  const rolePerms = rolePermissions.value
  if (!rolePerms || typeof rolePerms !== 'object') return false
  return !!rolePerms[item.permissionKey]
}
const getRoutePath = (route) => {
  if (!route) return ''
  if (typeof route === 'string') return route
  if (typeof route === 'object' && typeof route.path === 'string') return route.path
  return ''
}
const normalizeQueryValue = (value) => (value == null ? '' : String(value))
const isRouteMatch = (route, { exact = true } = {}) => {
  const targetPath = getRoutePath(route)
  if (!targetPath) return false
  const current = router.currentRoute.value
  if (exact) {
    if (current.path !== targetPath) return false
  } else if (current.path !== targetPath && !current.path.startsWith(`${targetPath}/`)) {
    return false
  }
  if (typeof route === 'object' && route.query) {
    return Object.entries(route.query).every(
      ([key, value]) => normalizeQueryValue(current.query?.[key]) === normalizeQueryValue(value),
    )
  }
  return true
}
const navItems = computed(() => {
  const allowedRoutes = ['/admin', '/admin/kuisioner', '/admin/tracer-akreditasi', '/admin/alumni', '/admin/bank-soal']
  const applyRestrictedMenu = restrictFacultyMenu.value && (isFacultyAdmin.value || isProdiAdmin.value)
  const filterNavItems = (items) =>
    items
      .map((item) => {
        const children = item.children ? filterNavItems(item.children) : []
        const path = getRoutePath(item.route)
        const allowedByRestriction = !applyRestrictedMenu || !path || allowedRoutes.includes(path)
        const allowedSelf = allowedByRestriction && hasNavAccess(item)
        if (!allowedSelf && !children.length) return null
        return { ...item, children }
      })
      .filter(Boolean)
  return filterNavItems(adminNav)
})

const defaultAdminProfile = {
  name: 'Anita Rahmania',
  role: 'Koordinator CDC',
  email: 'admin@tracer.local',
  avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=240&q=60',
}

const adminProfile = computed(() => {
  const user = auth.user.value || {}
  return {
    name: user.fullName || user.name || defaultAdminProfile.name,
    role: user.role || defaultAdminProfile.role,
    email: user.email || defaultAdminProfile.email,
    avatar: user.avatar || defaultAdminProfile.avatar,
  }
})

const lastSynced = computed(() => {
  if (!dashboard.lastFetched) return 'Belum ada sinkronisasi'
  return new Date(dashboard.lastFetched).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
})

const NAV_STATE_KEY = 'admin-nav-collapsed'
const getStoredNavState = () => {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(NAV_STATE_KEY) === 'true'
}
const persistNavState = (value) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(NAV_STATE_KEY, String(value))
}

const isNavCollapsed = ref(getStoredNavState())
const toggleNav = () => {
  isNavCollapsed.value = !isNavCollapsed.value
  persistNavState(isNavCollapsed.value)
}
const openSubmenus = ref({})
const isSubmenuOpen = (item) => !!openSubmenus.value[item.label]
const toggleSubmenu = (item) => {
  openSubmenus.value = {
    ...openSubmenus.value,
    [item.label]: !isSubmenuOpen(item),
  }
}

const handleLogout = () => {
  auth.logout()
  router.push('/login')
}
const openLogoutDialog = () => {
  showLogoutDialog.value = true
}
const closeLogoutDialog = () => {
  showLogoutDialog.value = false
}
const confirmLogout = () => {
  closeLogoutDialog()
  handleLogout()
}

const isNavItemActive = (item) => {
  const targetPath = getRoutePath(item.route)
  const shouldUseExactMatch = targetPath === '/admin'
  if (item.route && isRouteMatch(item.route, { exact: shouldUseExactMatch })) return true
  if (item.children?.length) {
    return item.children.some((child) => isNavItemActive(child))
  }
  return false
}
const activeNavChildren = computed(() => {
  const items = navItems.value || []
  for (const item of items) {
    if (item.children?.length && isSubmenuOpen(item)) {
      return item.children
    }
  }
  return []
})

const handleNavClick = (item) => {
  if (!item.route) return
  router.push(item.route)
}

const iconPaths = {
  overview: [
    'M4 4h7v7H4z',
    'M13 4h7v5h-7z',
    'M4 13h5v7H4z',
    'M11 13h9v7h-9z',
  ],
  kuisioner: [
    'M7 4h10a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    'M9 8h8',
    'M9 11h8',
    'M9 14h6',
    'M5 8h1',
    'M5 11h1',
    'M5 14h1',
  ],
  akreditasi: [
    'M8 21h8',
    'M12 17v4',
    'M7 4h10v2a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4z',
    'M5 6H3a2 2 0 0 0 0 4h2',
    'M19 6h2a2 2 0 0 1 0 4h-2',
  ],
  alumni: [
    'M12 13c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z',
    'M5 19c0-3.31 3.13-5 7-5s7 1.69 7 5v1H5z',
  ],
  bank: [
    'M4 8h16',
    'M4 12h16',
    'M4 16h16',
    'M7 4h10l1 2H6z',
  ],
  cta: [
    'M5 11h14l-3 3',
    'M5 13h14l-3-3',
    'M5 7h14',
  ],
  lowongan: [
    'M7 8V6a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v2',
    'M5 8h14v11H5z',
    'M9 12h6',
    'M9 15h4',
  ],
  artikel: [
    'M6 4h12v16H6z',
    'M9 8h6',
    'M9 11h6',
    'M9 14h4',
  ],
  user: [
    'M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z',
    'M5 20a7 7 0 0 1 14 0',
  ],
  berita: [
    'M6 4h12v16H6z',
    'M9 7h9',
    'M9 11h9',
    'M9 15h6',
  ],
}

const renderIcon = (name) => iconPaths[name] || iconPaths.overview
</script>

<template>
  <div
    class="relative flex h-screen overflow-hidden bg-slate-100 text-slate-900"
    :class="{ 'admin-nav-collapsed': isNavCollapsed }"
  >
    <aside
      class="hidden flex-shrink-0 flex-col border-r border-sidebar-border bg-slate-100 text-sidebar-foreground shadow-sm transition-all duration-300 lg:flex"
      :class="isNavCollapsed ? 'w-20 opacity-100 overflow-hidden px-3 py-4' : 'w-80 opacity-100 px-6 py-8'"
    >
      <template v-if="isNavCollapsed">
        <div class="flex h-full flex-col items-center gap-4">
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-md border border-sidebar-border bg-sidebar text-xs font-semibold text-sidebar-foreground/80 shadow-sm transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            @click="toggleNav"
            aria-label="Tampilkan menu"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          </button>
          <img
            :src="adminProfile.avatar"
            alt="Admin avatar"
            class="h-10 w-10 rounded-2xl object-cover shadow-sm"
          />
          <div class="h-px w-full bg-sidebar-border/80" />
          <div class="flex flex-1 flex-col items-center gap-2 overflow-y-auto pb-2">
            <button
              v-for="item in navItems"
              :key="`mini-${getRoutePath(item.route) || item.label}`"
              type="button"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent transition"
              :class="isNavItemActive(item)
                ? 'nav-glass-active text-sidebar-foreground/70'
                : 'border-sidebar-border text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'"
              :title="item.label"
              @click.prevent="handleNavClick(item)"
            >
              <svg
                class="h-5 w-5"
                :class="isNavItemActive(item) ? 'text-teal-600' : 'text-sidebar-foreground/60'"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path v-for="(d, idx) in renderIcon(item.icon)" :key="`mini-${item.icon}-${idx}`" :d="d" />
              </svg>
            </button>
          </div>
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-md border border-sidebar-border text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            @click="openLogoutDialog"
            aria-label="Logout"
            title="Logout"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H3" />
              <path d="M21 19V5a2 2 0 0 0-2-2H9" />
            </svg>
          </button>
        </div>
      </template>
      <template v-else>
        <div class="mb-4 flex items-center justify-end">
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-md border border-sidebar-border bg-sidebar text-xs font-semibold text-sidebar-foreground/80 shadow-sm transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            @click="toggleNav"
            aria-label="Sembunyikan menu"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 6l12 12" />
              <path d="M6 18L18 6" />
            </svg>
          </button>
        </div>

        <div class="relative rounded-3xl bg-gradient-to-br from-teal-600 to-cyan-500 p-5 text-white shadow-lg shadow-teal-500/30">
          <button
            type="button"
            class="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
            @click="router.push('/admin/profile')"
            aria-label="Pengaturan profil admin"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 3v2" />
              <path d="M12 19v2" />
              <path d="M5.22 5.22l1.42 1.42" />
              <path d="M17.36 17.36l1.42 1.42" />
              <path d="M3 12h2" />
              <path d="M19 12h2" />
              <path d="M5.22 18.78l1.42-1.42" />
              <path d="M17.36 6.64l1.42-1.42" />
            </svg>
          </button>
          <div class="flex items-center gap-4">
            <img :src="adminProfile.avatar" alt="Admin avatar" class="h-14 w-14 rounded-2xl object-cover shadow-lg shadow-black/20" />
            <div>
              <p class="text-sm font-semibold">{{ adminProfile.name }}</p>
              <p class="text-xs text-white/80">{{ adminProfile.role }}</p>
              <p class="mt-1 text-[11px] text-white/70">{{ adminProfile.email }}</p>
            </div>
          </div>
          <div class="mt-5 flex items-center justify-between text-[11px] text-white/70">
            <span>Status sinkron</span>
            <span class="font-semibold text-white">{{ lastSynced }}</span>
          </div>
        </div>

        <nav class="mt-8 flex-1 space-y-2 overflow-y-auto text-sm font-medium text-sidebar-foreground/70">
          <div v-for="item in navItems" :key="getRoutePath(item.route) || item.label" class="space-y-1">
            <div class="flex items-center gap-2">
              <button
                class="flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2 transition"
                :class="
                  isNavItemActive(item)
                    ? 'nav-glass-active text-sidebar-foreground/70'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                "
                @click.prevent="handleNavClick(item)"
              >
                <svg
                  class="h-4 w-4 flex-shrink-0"
                  :class="isNavItemActive(item) ? 'text-teal-600' : 'text-sidebar-foreground/50'"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path v-for="(d, idx) in renderIcon(item.icon)" :key="`nav-${item.icon}-${idx}`" :d="d" />
                </svg>
                {{ item.label }}
              </button>
              <button
                v-if="item.children?.length"
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-md border border-sidebar-border text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :class="isSubmenuOpen(item) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''"
                @click.stop="toggleSubmenu(item)"
                aria-label="Toggle submenu"
              >
                <svg
                  class="h-4 w-4 transition duration-150"
                  :class="isSubmenuOpen(item) ? 'rotate-180' : ''"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.044l3.71-3.813a.75.75 0 111.08 1.04l-4.25 4.367a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div v-if="item.children?.length && isSubmenuOpen(item)" class="ml-7 space-y-1">
              <button
                v-for="child in item.children"
                :key="child.label"
                type="button"
                class="flex w-full items-center gap-2 rounded-md border border-transparent px-3 py-1.5 text-xs font-semibold transition"
                :class="
                  isNavItemActive(child)
                    ? 'nav-glass-active text-sidebar-foreground/70'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                "
                @click.prevent="handleNavClick(child)"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="isNavItemActive(child) ? 'bg-teal-500' : 'bg-sidebar-border'" />
                <span class="text-left">{{ child.label }}</span>
              </button>
            </div>
          </div>
        </nav>

        <div class="mt-6 space-y-4">
          <button
            class="w-full rounded-2xl border border-sidebar-border px-4 py-2 text-sm font-semibold text-sidebar-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            @click="openLogoutDialog"
          >
            Logout
          </button>
        </div>
      </template>
    </aside>

    <div class="flex flex-1 min-w-0 min-h-0 flex-col overflow-hidden">
      <div class="border-b border-slate-100 bg-white px-4 py-3 shadow-sm lg:hidden">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <img :src="adminProfile.avatar" alt="Admin avatar" class="h-10 w-10 rounded-2xl object-cover" />
            <div>
              <p class="text-sm font-semibold text-slate-900">{{ adminProfile.name }}</p>
              <p class="text-xs text-slate-500">{{ adminProfile.role }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              @click="router.push('/admin/profile')"
              aria-label="Pengaturan profil admin"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 3v2" />
                <path d="M12 19v2" />
                <path d="M5.22 5.22l1.42 1.42" />
                <path d="M17.36 17.36l1.42 1.42" />
                <path d="M3 12h2" />
                <path d="M19 12h2" />
                <path d="M5.22 18.78l1.42-1.42" />
                <path d="M17.36 6.64l1.42-1.42" />
              </svg>
            </button>
            <button
              class="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold text-slate-700 transition hover:bg-rose-100 hover:text-rose-700 hover:border-rose-200"
              @click="openLogoutDialog"
            >
              Logout
            </button>
          </div>
        </div>
        <div class="mt-3 space-y-2">
          <div class="flex gap-2 overflow-x-auto text-xs font-semibold text-slate-500">
            <div
              v-for="item in navItems"
              :key="`mobile-${getRoutePath(item.route) || item.label}`"
              class="flex items-center gap-1"
            >
              <button
                class="rounded-full border border-slate-200 px-3 py-1"
                :class="isNavItemActive(item) ? 'bg-slate-900 text-white border-slate-900' : ''"
                @click.prevent="handleNavClick(item)"
              >
                {{ item.label }}
              </button>
              <button
                v-if="item.children?.length"
                type="button"
                class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                :class="isSubmenuOpen(item) ? 'bg-slate-100' : ''"
                @click.stop="toggleSubmenu(item)"
                aria-label="Toggle submenu"
              >
                <svg
                  class="h-3.5 w-3.5 transition duration-150"
                  :class="isSubmenuOpen(item) ? 'rotate-180' : ''"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.044l3.71-3.813a.75.75 0 111.08 1.04l-4.25 4.367a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div v-if="activeNavChildren.length" class="flex gap-2 overflow-x-auto text-[11px] font-semibold text-slate-500">
            <button
              v-for="child in activeNavChildren"
              :key="`mobile-sub-${child.label}`"
              class="rounded-full border border-slate-200 px-3 py-1"
              :class="isNavItemActive(child) ? 'bg-teal-600 text-white border-teal-600' : ''"
              @click.prevent="handleNavClick(child)"
            >
              {{ child.label }}
            </button>
          </div>
        </div>
      </div>

      <main
        class="flex-1 overflow-y-auto bg-slate-50/60"
        style="scrollbar-width: thin; scrollbar-color: rgba(51,65,85,0.1) transparent;"
      >
        <div class="space-y-10 py-6">
          <slot />
        </div>
      </main>
    </div>

    <Transition name="alert-dialog">
      <div
        v-if="showLogoutDialog"
        class="alert-dialog-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-desc"
        @click.self="closeLogoutDialog"
      >
        <div class="alert-dialog-panel w-full max-w-md rounded-2xl bg-white p-6 shadow-xl shadow-slate-900/20">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.25em] text-rose-600">Konfirmasi</p>
              <h3 id="logout-dialog-title" class="text-lg font-semibold text-slate-900">Keluar dari dashboard?</h3>
              <p id="logout-dialog-desc" class="mt-2 text-sm text-slate-600">
                Sesi kamu akan berakhir. Kamu perlu login lagi untuk akses admin.
              </p>
            </div>
            <button
              type="button"
              class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              @click="closeLogoutDialog"
            >
              Tutup
            </button>
          </div>
          <div class="mt-5 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              @click="closeLogoutDialog"
            >
              Batal
            </button>
            <button
              type="button"
              class="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110"
              @click="confirmLogout"
            >
              Ya, logout
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
