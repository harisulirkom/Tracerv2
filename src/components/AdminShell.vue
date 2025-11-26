<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'
import { useDashboardData } from '../stores/dashboard'

const router = useRouter()
const auth = useAuth()
const { dashboard } = useDashboardData()

const adminNav = [
  { label: 'Ikhtisar', route: '/admin', icon: 'overview' },
  { label: 'Kelola kuisioner', route: '/admin/kuisioner', icon: 'kuisioner' },
  { label: 'Daftar alumni', route: '/admin/alumni', icon: 'alumni' },
  { label: 'Bank soal', route: '/admin/bank-soal', icon: 'bank' },
  { label: 'CTA Slider', route: '/admin/cta', icon: 'cta' },
  { label: 'Kelola lowongan', route: '/admin/lowongan', icon: 'lowongan' },
  { label: 'Artikel & tips', route: '/admin/artikel', icon: 'artikel' },
  { label: 'User', route: '/admin/user', icon: 'user' },
  { label: 'Berita', route: '/admin/berita', icon: 'berita' },
]

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

const handleLogout = () => {
  auth.logout()
  router.push('/login')
}

const isNavItemActive = (item) => router.currentRoute.value.path === item.route

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
  <div class="relative flex min-h-screen bg-slate-100 text-slate-900">
    <div
      v-if="isNavCollapsed"
      class="fixed left-3 top-4 bottom-6 z-30 flex w-20 flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-[0_20px_60px_-25px_rgba(15,118,110,0.25)]"
    >
      <button
        type="button"
        class="flex h-9 w-9 items-center justify-center rounded-full border border-teal-100 bg-white text-xs font-semibold text-slate-700 shadow-sm transition hover:scale-105"
        @click="toggleNav"
        aria-label="Tampilkan menu"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </svg>
      </button>
      <p class="text-[10px] font-semibold text-slate-700 text-center leading-tight px-1">
        Dashboard<br />CDC UIN<br />Syekh Wasil<br />Kediri
      </p>
      <img
        :src="adminProfile.avatar"
        alt="Admin avatar"
        class="h-10 w-10 rounded-2xl object-cover shadow border border-slate-200"
      />
      <div class="h-px w-full bg-slate-200/80" />
      <div
        class="flex flex-1 flex-col items-center gap-2 overflow-y-auto pb-1 pr-1"
        style="scrollbar-width: thin; scrollbar-color: rgba(51,65,85,0.1) transparent;"
      >
        <button
          v-for="item in adminNav"
          :key="`mini-${item.route}`"
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-xl border text-slate-500 transition"
          :class="isNavItemActive(item) ? 'border-teal-200 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white hover:border-slate-300 hover:text-slate-700'"
          :title="item.label"
          @click.prevent="handleNavClick(item)"
        >
          <svg
            class="h-5 w-5"
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
    </div>

    <aside
      class="hidden flex-shrink-0 flex-col border-r border-white/50 bg-gradient-to-b from-white/70 via-white/40 to-white/70 px-6 py-8 shadow-[0_25px_80px_-30px_rgba(15,118,110,0.45)] backdrop-blur-xl transition-all duration-300 lg:flex"
      :class="isNavCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-80 opacity-100'"
    >
      <div class="mb-4 flex items-center justify-end">
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-full border border-teal-100 bg-white/90 text-sm font-semibold text-slate-700 shadow-lg shadow-emerald-500/20 transition hover:scale-105 hover:bg-white"
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

      <nav class="mt-8 space-y-1 text-sm font-semibold text-slate-500">
        <button
          v-for="item in adminNav"
          :key="item.route"
          class="flex w-full items-center gap-3 rounded-2xl px-3 py-2 transition"
          :class="
            isNavItemActive(item)
              ? 'border border-teal-100 bg-teal-50 text-teal-700 shadow-sm'
              : 'hover:bg-slate-50 hover:text-slate-700'
          "
          @click.prevent="handleNavClick(item)"
        >
          <svg
            class="h-4 w-4 flex-shrink-0"
            :class="isNavItemActive(item) ? 'text-teal-600' : 'text-slate-400'"
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
      </nav>

      <div class="mt-auto space-y-4">
        <div class="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-xs text-slate-500">
          <p class="font-semibold text-slate-900">Catatan</p>
          <p>Status data: {{ dashboard.loading ? 'Memuat...' : 'Sinkron' }}</p>
        </div>
        <button
          class="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-rose-100 hover:text-rose-700 hover:border-rose-200"
          @click="handleLogout"
        >
          Logout
        </button>
      </div>
    </aside>

    <div class="flex-1 overflow-hidden">
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
              @click="handleLogout"
            >
              Logout
            </button>
          </div>
        </div>
        <div class="mt-3 flex gap-2 overflow-x-auto text-xs font-semibold text-slate-500">
          <button
            v-for="item in adminNav"
            :key="`mobile-${item.route}`"
            class="rounded-full border border-slate-200 px-3 py-1"
            :class="isNavItemActive(item) ? 'bg-slate-900 text-white border-slate-900' : ''"
            @click.prevent="handleNavClick(item)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <main
        class="max-h-screen overflow-y-auto bg-slate-50/60 transition-[padding] duration-200"
        :class="isNavCollapsed ? 'lg:pl-20 xl:pl-24' : ''"
        style="scrollbar-width: thin; scrollbar-color: rgba(51,65,85,0.1) transparent;"
      >
        <div class="space-y-10 px-4 py-6 sm:px-6 lg:px-10">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
