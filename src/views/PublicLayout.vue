<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter, RouterView, RouterLink } from 'vue-router'
import { useAuth } from '../stores/auth'
import cdcLogo from '../assets/CDC.svg'

const navItems = [
  { name: 'Home', to: '/' },
  {
    name: 'Profil',
    to: '/tentang',
    children: [
      { name: 'Tentang CDC', to: '/coming-soon/tentang-cdc' },
      { name: 'Struktur Organisasi', to: '/coming-soon/struktur-organisasi' },
      { name: 'SDM / Tim Pelaksana', to: '/coming-soon/sdm-tim-pelaksana' },
    ],
  },
  {
    name: 'Layanan',
    to: '/layanan',
    children: [
      { name: 'Konseling Karier', to: '/coming-soon/konseling-karier' },
      { name: 'Bimbingan CV & Resume', to: '/coming-soon/bimbingan-cv-resume' },
      { name: 'Bimbingan Wawancara', to: '/coming-soon/bimbingan-wawancara' },
      { name: 'Coaching Career Path', to: '/coming-soon/coaching-career-path' },
      { name: 'Pelatihan Softskill', to: '/coming-soon/pelatihan-softskill' },
      { name: 'Bimbingan Magang & PKL', to: '/coming-soon/bimbingan-magang-pkl' },
      { name: 'Layanan Penelusuran Alumni', to: '/coming-soon/layanan-penelusuran-alumni' },
      { name: 'Pusat Informasi Studi Lanjut', to: '/coming-soon/informasi-studi-lanjut' },
    ],
  },
  {
    name: 'Lowongan Kerja',
    to: '/lowongan',
    children: [
      { name: 'Lowongan Terbaru', to: '/lowongan#lowongan-terbaru' },
      { name: 'Lowongan Berdasarkan Fakultas/Prodi', to: '/lowongan#lowongan-fakultas-prodi' },
      { name: 'Lowongan Magang', to: '/lowongan#lowongan-magang' },
      { name: 'Perusahaan Mitra', to: '/lowongan#perusahaan-mitra' },
      { name: 'Submit Lowongan (untuk perusahaan)', to: '/lowongan#submit-lowongan' },
    ],
  },
  { name: 'Artikel & Tips', to: '/artikel' },
  { name: 'Berita', to: '/berita' },
]

const route = useRoute()
const router = useRouter()
const normalizeToPath = (to) => {
  if (!to) return ''
  if (typeof to === 'string') return to.split('#')[0]
  if (typeof to === 'object' && typeof to.path === 'string') return to.path
  return ''
}
const isActive = (item) =>
  computed(() => {
    const currentPath = route.path
    const matches = (target) => normalizeToPath(target) === currentPath
    if (matches(item.to)) return true
    if (item.children) {
      return item.children.some((child) => matches(child.to))
    }
    return false
  })
const auth = useAuth()
const handleLogout = () => {
  auth.logout()
  router.push('/login')
}

const showSurveyPicker = ref(false)
const openSurveyPicker = () => {
  showSurveyPicker.value = true
}
const closeSurveyPicker = () => {
  showSurveyPicker.value = false
}
const goSurvey = (target) => {
  closeMobileNav()
  if (target === 'pengguna') {
    router.push('/kuisioner/pengguna')
  } else if (target === 'alumni') {
    router.push('/kuisioner/alumni')
  } else {
    router.push('/kuisioner')
  }
  closeSurveyPicker()
}

const mobileNavOpen = ref(false)
const toggleMobileNav = () => {
  mobileNavOpen.value = !mobileNavOpen.value
}
const closeMobileNav = () => {
  mobileNavOpen.value = false
  openMobileDropdown.value = ''
}

const openMobileDropdown = ref('')
const toggleMobileDropdown = (name) => {
  openMobileDropdown.value = openMobileDropdown.value === name ? '' : name
}

const openDesktopDropdown = ref('')
let desktopCloseTimer
const DESKTOP_CLOSE_DELAY = 800
const clearDesktopTimer = () => {
  if (desktopCloseTimer) {
    clearTimeout(desktopCloseTimer)
    desktopCloseTimer = null
  }
}
const openDesktopMenu = (name) => {
  clearDesktopTimer()
  openDesktopDropdown.value = name
}
const scheduleCloseDesktopMenu = () => {
  clearDesktopTimer()
  desktopCloseTimer = setTimeout(() => {
    openDesktopDropdown.value = ''
  }, DESKTOP_CLOSE_DELAY)
}
onBeforeUnmount(() => clearDesktopTimer())

const resolveNavLink = (target) => target || '/404'

const footerLinks = computed(() => navItems.map(({ name, to }) => ({ name, to })).filter((item) => item.to))
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
    <header class="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-3">
          <RouterLink
            to="/"
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-md shadow-indigo-500/20 ring-1 ring-slate-100 overflow-hidden"
          >
            <img :src="cdcLogo" alt="Logo CDC UIN Kediri" class="h-12 w-12 rounded-xl object-cover" />
          </RouterLink>
          <div class="hidden flex-col leading-tight sm:flex">
            
            <span class="text-[11px] uppercase tracking-[0.22em] text-slate-500">Career Development Center</span>
          </div>
        </div>

        <nav
          class="hidden flex-1 items-center justify-center gap-4 text-sm font-semibold text-slate-600 md:flex"
          @mouseenter="clearDesktopTimer"
          @mouseleave="scheduleCloseDesktopMenu"
        >
          <div
            v-for="item in navItems"
            :key="item.name"
            class="relative pb-6"
            @mouseenter="openDesktopMenu(item.name)"
          >
            <RouterLink
              v-if="!item.children"
              :to="resolveNavLink(item.to)"
              class="inline-flex items-center gap-1 rounded-full px-3 py-2 transition hover:text-slate-900"
              :class="isActive(item).value ? 'text-slate-900' : ''"
            >
              {{ item.name }}
            </RouterLink>
            <div v-else class="relative">
              <RouterLink
                :to="resolveNavLink(item.to)"
                class="inline-flex items-center gap-1 rounded-full px-3 py-2 transition hover:text-slate-900"
                :class="openDesktopDropdown === item.name || isActive(item).value ? 'text-slate-900' : ''"
                @focus="openDesktopMenu(item.name)"
              >
                {{ item.name }}
                <svg
                  class="h-3 w-3 text-slate-500 transition duration-150"
                  :class="openDesktopDropdown === item.name ? 'rotate-180 text-slate-700' : ''"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.044l3.71-3.813a.75.75 0 111.08 1.04l-4.25 4.367a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clip-rule="evenodd"
                  />
                </svg>
              </RouterLink>
              <div
                v-if="item.children"
                class="absolute left-1/2 top-full z-20 w-60 -translate-x-1/2 rounded-xl border border-slate-200 bg-white/95 p-3 text-[13px] shadow-lg shadow-slate-900/10 transition duration-150"
                :class="openDesktopDropdown === item.name ? 'opacity-100 translate-y-0 visible pointer-events-auto' : 'opacity-0 -translate-y-1 invisible pointer-events-none'"
                @mouseenter="openDesktopMenu(item.name)"
                @mouseleave="scheduleCloseDesktopMenu"
              >
                <RouterLink
                  v-for="child in item.children"
                  :key="`${item.name}-${child.name}`"
                  :to="resolveNavLink(child.to)"
                  class="flex items-start rounded-lg px-3 py-2 text-left text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                  @click="openDesktopDropdown = ''"
                >
                  {{ child.name }}
                </RouterLink>
              </div>
            </div>
          </div>
        </nav>

        <div class="ml-auto flex items-center gap-3">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
            @click="toggleMobileNav"
            aria-label="Buka menu"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          </button>
          <template v-if="!auth.isAuthenticated.value">
            <RouterLink
              to="/login"
              class="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 md:inline-flex"
            >
              Login
            </RouterLink>
          </template>
          <template v-else>
            <RouterLink
              to="/admin"
              class="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 md:inline-flex"
            >
              Dashboard
            </RouterLink>
          </template>
          <button
            type="button"
            class="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:brightness-110"
            @click="openSurveyPicker"
          >
            Isi Kuisioner
          </button>
          <button
            v-if="auth.isAuthenticated.value"
            class="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 md:inline-flex"
            @click="handleLogout"
          >
            Logout
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <RouterView />
    </main>

    <footer class="mt-10 border-t border-slate-200/80 bg-white/70 py-10 px-4 sm:px-6 lg:px-8">
      <div class="mx-auto grid max-w-6xl gap-10 text-sm text-slate-600 sm:grid-cols-3">
        <div class="space-y-3">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-md shadow-indigo-500/20 ring-1 ring-slate-100"
          >
            <img :src="cdcLogo" alt="Logo CDC" class="h-12 w-12 rounded-2xl object-cover" />
          </div>
          <p>Platform tracer study untuk pengumpulan data alumni, analitik, dan laporan resmi.</p>
        </div>
        <div class="space-y-3">
          <p class="text-sm font-semibold text-slate-900">Menu</p>
          <div class="flex flex-col gap-2">
            <RouterLink v-for="item in footerLinks" :key="item.to" :to="item.to" class="hover:text-slate-900">
              {{ item.name }}
            </RouterLink>
            <RouterLink to="/login" class="hover:text-slate-900">Login</RouterLink>
          </div>
        </div>
        <div class="space-y-3">
          <p class="text-sm font-semibold text-slate-900">Hubungi</p>
          <p>Email: tracer@kampus.ac.id</p>
          <p>Jam: Senin-Jumat, 09.00-17.00 WIB</p>
          <button class="text-indigo-600 hover:text-indigo-500" type="button" @click="openSurveyPicker">
            Isi kuisioner sekarang ->
          </button>
        </div>
      </div>
      <div class="mx-auto mt-8 max-w-6xl text-xs text-slate-500">(c) 2025 Tracer Study. Semua hak dilindungi.</div>
    </footer>

    <div
      v-if="mobileNavOpen"
      class="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
      @click="closeMobileNav"
    >
      <div
        class="absolute right-0 top-0 h-full w-72 max-w-full border-l border-slate-200 bg-white shadow-2xl shadow-slate-900/20"
        @click.stop
      >
        <div class="flex items-center justify-between border-b border-slate-100 p-4">
          <div class="flex items-center gap-2">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-md shadow-indigo-500/15 ring-1 ring-slate-100">
              <img :src="cdcLogo" alt="Logo CDC" class="h-10 w-10 rounded-xl object-cover" />
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-900">CDC UIN Kediri</p>
              <p class="text-xs text-slate-500">Career Development Center</p>
            </div>
          </div>
          <button
            type="button"
            class="rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-50"
            @click="closeMobileNav"
            aria-label="Tutup menu"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 6l12 12" />
              <path d="M6 18L18 6" />
            </svg>
          </button>
        </div>
        <nav class="flex flex-col gap-2 p-4 text-sm font-semibold text-slate-700">
          <div v-for="item in navItems" :key="`mobile-${item.name}`" class="rounded-xl">
            <div class="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-slate-50">
              <RouterLink
                v-if="item.to"
                :to="resolveNavLink(item.to)"
                class="flex-1"
                :class="isActive(item).value ? 'text-slate-900' : ''"
                @click="closeMobileNav"
              >
                {{ item.name }}
              </RouterLink>
              <span v-else class="flex-1">{{ item.name }}</span>
              <button
                v-if="item.children"
                type="button"
                class="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                @click="toggleMobileDropdown(item.name)"
                :aria-expanded="openMobileDropdown === item.name"
                aria-label="Toggle submenu"
              >
                <svg
                  class="h-4 w-4 transition duration-150"
                  :class="openMobileDropdown === item.name ? 'rotate-180' : ''"
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
            <div
              v-if="item.children"
              class="mt-1 flex flex-col gap-1 rounded-xl bg-slate-50 px-3 py-2 text-[13px] font-semibold text-slate-700"
              v-show="openMobileDropdown === item.name"
            >
              <RouterLink
                v-for="child in item.children"
                :key="`${item.name}-${child.name}`"
                :to="resolveNavLink(child.to)"
                class="rounded-lg px-3 py-2 transition hover:bg-white"
                @click="closeMobileNav"
              >
                {{ child.name }}
              </RouterLink>
            </div>
          </div>
          <button
            type="button"
            class="mt-2 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            @click="openSurveyPicker(); closeMobileNav()"
          >
            Isi Kuisioner
          </button>
          <RouterLink
            v-if="auth.isAuthenticated.value"
            to="/admin"
            class="rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
            @click="closeMobileNav"
          >
            Dashboard
          </RouterLink>
          <RouterLink
            v-else
            to="/login"
            class="rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
            @click="closeMobileNav"
          >
            Login
          </RouterLink>
          <button
            v-if="auth.isAuthenticated.value"
            type="button"
            class="rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            @click="handleLogout(); closeMobileNav()"
          >
            Logout
          </button>
        </nav>
      </div>
    </div>

    <div
      v-if="showSurveyPicker"
      class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-4 py-8"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full max-w-xl rounded-3xl border border-white/40 bg-white/80 p-6 shadow-2xl shadow-indigo-500/20 backdrop-blur-xl">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">Pilih kuisioner</p>
            <h3 class="text-lg font-semibold text-slate-900">Tentukan jenis kuisioner</h3>
            <p class="text-xs text-slate-600">Kami menyediakan dua tipe: alumni dan pengguna alumni.</p>
          </div>
          <button
            type="button"
            class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            @click="closeSurveyPicker"
          >
            Tutup
          </button>
        </div>

        <div class="mt-5 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            class="group relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-500 p-4 text-left shadow-lg shadow-indigo-500/25 transition hover:scale-[1.01]"
            @click="goSurvey('alumni')"
          >
            <div class="absolute inset-0 bg-white/10 opacity-0 transition group-hover:opacity-20" />
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-sm font-semibold text-slate-900">AL</div>
              <div>
                <p class="text-sm font-semibold text-white">Kuisioner Alumni</p>
                <p class="text-xs text-indigo-50">Isi data tracer untuk lulusan.</p>
              </div>
            </div>
          </button>
          <button
            type="button"
            class="group relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-500 p-4 text-left shadow-lg shadow-indigo-500/25 transition hover:scale-[1.01]"
            @click="goSurvey('pengguna')"
          >
            <div class="absolute inset-0 bg-white/10 opacity-0 transition group-hover:opacity-20" />
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-sm font-semibold text-slate-900">PA</div>
              <div>
                <p class="text-sm font-semibold text-white">Kuisioner Pengguna Alumni</p>
                <p class="text-xs text-indigo-50">Masukan untuk perusahaan atau pengguna alumni.</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
