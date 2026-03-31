<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter, RouterView, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import FloatingLanguageSwitcher from '@/components/FloatingLanguageSwitcher.vue'
import { useAuth } from '../stores/auth'
import cdcLogo from '../assets/CDC.svg'

const { t } = useI18n()

const navItems = computed(() => [
  { key: 'home', name: t('public.nav.home'), to: '/' },
  {
    key: 'profile',
    name: t('public.nav.profile'),
    to: '/tentang',
    children: [
      { key: 'about-cdc', name: t('public.navChildren.aboutCdc'), to: '/coming-soon/tentang-cdc' },
      { key: 'structure', name: t('public.navChildren.organizationStructure'), to: '/coming-soon/struktur-organisasi' },
      { key: 'team', name: t('public.navChildren.executionTeam'), to: '/coming-soon/sdm-tim-pelaksana' },
    ],
  },
  {
    key: 'services',
    name: t('public.nav.services'),
    to: '/layanan',
    children: [
      { key: 'career-counseling', name: t('public.navChildren.careerCounseling'), to: '/coming-soon/konseling-karier' },
      { key: 'cv-guidance', name: t('public.navChildren.cvGuidance'), to: '/coming-soon/bimbingan-cv-resume' },
      { key: 'interview-guidance', name: t('public.navChildren.interviewGuidance'), to: '/coming-soon/bimbingan-wawancara' },
      { key: 'career-path', name: t('public.navChildren.coachingCareerPath'), to: '/coming-soon/coaching-career-path' },
      { key: 'softskill', name: t('public.navChildren.softskillTraining'), to: '/coming-soon/pelatihan-softskill' },
      { key: 'internship', name: t('public.navChildren.internshipGuidance'), to: '/coming-soon/bimbingan-magang-pkl' },
      { key: 'alumni-tracking', name: t('public.navChildren.alumniTrackingService'), to: '/coming-soon/layanan-penelusuran-alumni' },
      { key: 'study-center', name: t('public.navChildren.studyInfoCenter'), to: '/coming-soon/informasi-studi-lanjut' },
    ],
  },
  {
    key: 'jobs',
    name: t('public.nav.jobs'),
    to: '/lowongan',
    children: [
      { key: 'latest-jobs', name: t('public.navChildren.latestJobs'), to: '/lowongan#lowongan-terbaru' },
      { key: 'faculty-jobs', name: t('public.navChildren.jobsByFaculty'), to: '/lowongan#lowongan-fakultas-prodi' },
      { key: 'internship-jobs', name: t('public.navChildren.internshipJobs'), to: '/lowongan#lowongan-magang' },
      { key: 'partners', name: t('public.navChildren.partnerCompanies'), to: '/lowongan#perusahaan-mitra' },
      { key: 'submit-jobs', name: t('public.navChildren.submitJob'), to: '/lowongan#submit-lowongan' },
    ],
  },
  { key: 'survey-list', name: t('public.nav.surveyList'), to: '/daftar-kuisioner' },
  { key: 'articles', name: t('public.nav.articles'), to: '/artikel' },
  { key: 'news', name: t('public.nav.news'), to: '/berita' },
])

const route = useRoute()
const router = useRouter()
const normalizeToPath = (to) => {
  if (!to) return ''
  if (typeof to === 'string') return to.split('#')[0]
  if (typeof to === 'object' && typeof to.path === 'string') return to.path
  return ''
}
const isActive = (item) => {
  const currentPath = route.path
  const matches = (target) => normalizeToPath(target) === currentPath
  if (matches(item.to)) return true
  if (item.children) {
    return item.children.some((child) => matches(child.to))
  }
  return false
}

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
const toggleMobileDropdown = (key) => {
  openMobileDropdown.value = openMobileDropdown.value === key ? '' : key
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
const openDesktopMenu = (key) => {
  clearDesktopTimer()
  openDesktopDropdown.value = key
}
const scheduleCloseDesktopMenu = () => {
  clearDesktopTimer()
  desktopCloseTimer = setTimeout(() => {
    openDesktopDropdown.value = ''
  }, DESKTOP_CLOSE_DELAY)
}
onBeforeUnmount(() => clearDesktopTimer())

const resolveNavLink = (target) => target || '/404'

const footerLinks = computed(() => navItems.value.map(({ name, to }) => ({ name, to })).filter((item) => item.to))
</script>

<template>
  <div class="public-shell">
    <header class="public-topbar">
      <div class="public-container flex items-center gap-4 py-2.5">
        <div class="flex items-center gap-3">
          <RouterLink
            to="/"
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-md shadow-indigo-500/20 ring-1 ring-slate-100 overflow-hidden"
          >
            <img :src="cdcLogo" :alt="t('public.brand.logoAlt')" class="h-10 w-10 rounded-xl object-cover" />
          </RouterLink>
          <div class="hidden flex-col leading-tight sm:flex">
            <span class="text-[11px] uppercase tracking-[0.22em] text-slate-500">{{ t('public.brand.center') }}</span>
          </div>
        </div>

        <nav
          class="hidden flex-1 items-center justify-center gap-3 text-sm font-semibold text-slate-600 md:flex"
          @mouseenter="clearDesktopTimer"
          @mouseleave="scheduleCloseDesktopMenu"
        >
          <div
            v-for="item in navItems"
            :key="item.key"
            class="relative pb-4"
            @mouseenter="openDesktopMenu(item.key)"
          >
            <RouterLink
              v-if="!item.children"
              :to="resolveNavLink(item.to)"
              class="motion-underline-link inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition hover:text-slate-900"
              :class="isActive(item) ? 'text-slate-900 is-active' : ''"
            >
              {{ item.name }}
            </RouterLink>
            <div v-else class="relative">
              <RouterLink
                :to="resolveNavLink(item.to)"
                class="motion-underline-link inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition hover:text-slate-900"
                :class="openDesktopDropdown === item.key || isActive(item) ? 'text-slate-900 is-active' : ''"
                @focus="openDesktopMenu(item.key)"
              >
                {{ item.name }}
                <svg
                  class="h-3 w-3 text-slate-500 transition duration-150"
                  :class="openDesktopDropdown === item.key ? 'rotate-180 text-slate-700' : ''"
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
                :class="openDesktopDropdown === item.key ? 'opacity-100 translate-y-0 visible pointer-events-auto' : 'opacity-0 -translate-y-1 invisible pointer-events-none'"
                @mouseenter="openDesktopMenu(item.key)"
                @mouseleave="scheduleCloseDesktopMenu"
              >
                <RouterLink
                  v-for="child in item.children"
                  :key="`${item.key}-${child.key}`"
                  :to="resolveNavLink(child.to)"
                  class="motion-underline-link flex items-start rounded-lg px-3 py-2 text-left text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                  @click="openDesktopDropdown = ''"
                >
                  {{ child.name }}
                </RouterLink>
              </div>
            </div>
          </div>
        </nav>

        <div class="ml-auto flex items-center gap-2.5">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
            @click="toggleMobileNav"
            :aria-label="t('public.actions.openMenu')"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          </button>

          <template v-if="auth.isAuthenticated.value">
            <RouterLink
              to="/admin"
              class="hidden rounded-full border border-slate-200 px-3.5 py-1.5 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 md:inline-flex"
            >
              {{ t('public.actions.dashboard') }}
            </RouterLink>
          </template>
          <button
            type="button"
            class="motion-card-sheen inline-flex items-center rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 px-3.5 py-1.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:brightness-110"
            @click="openSurveyPicker"
          >
            {{ t('public.actions.fillSurvey') }}
          </button>
          <button
            v-if="auth.isAuthenticated.value"
            class="hidden rounded-full border border-slate-200 px-3.5 py-1.5 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 md:inline-flex"
            @click="handleLogout"
          >
            {{ t('public.actions.logout') }}
          </button>
        </div>
      </div>
    </header>

    <main v-auto-reveal class="public-main public-container">
      <RouterView />
    </main>

    <footer class="public-footer py-10">
      <div class="public-container grid gap-10 text-sm text-slate-600 sm:grid-cols-3">
        <div class="space-y-3">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-md shadow-indigo-500/20 ring-1 ring-slate-100"
          >
            <img :src="cdcLogo" :alt="t('public.brand.logoAlt')" class="h-12 w-12 rounded-2xl object-cover" />
          </div>
          <p>{{ t('public.footer.description') }}</p>
        </div>
        <div class="space-y-3">
          <p class="text-sm font-semibold text-slate-900">{{ t('public.footer.menu') }}</p>
          <div class="flex flex-col gap-2">
            <RouterLink v-for="item in footerLinks" :key="item.to" :to="item.to" class="motion-underline-link hover:text-slate-900">
              {{ item.name }}
            </RouterLink>

          </div>
        </div>
        <div class="space-y-3">
          <p class="text-sm font-semibold text-slate-900">{{ t('public.footer.contact') }}</p>
          <p>{{ t('public.footer.email') }}</p>
          <p>{{ t('public.footer.hours') }}</p>
          <button class="text-indigo-600 hover:text-indigo-500" type="button" @click="openSurveyPicker">
            {{ t('public.footer.fillNow') }}
          </button>
        </div>
      </div>
      <div class="public-container mt-8 text-xs text-slate-500">
        {{ t('public.footer.copyright', { year: new Date().getFullYear() }) }}
      </div>
    </footer>

    <FloatingLanguageSwitcher />

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
              <img :src="cdcLogo" :alt="t('public.brand.logoAlt')" class="h-10 w-10 rounded-xl object-cover" />
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-900">{{ t('public.brand.shortTitle') }}</p>
              <p class="text-xs text-slate-500">{{ t('public.brand.center') }}</p>
            </div>
          </div>
          <button
            type="button"
            class="rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-50"
            @click="closeMobileNav"
            :aria-label="t('public.actions.closeMenu')"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 6l12 12" />
              <path d="M6 18L18 6" />
            </svg>
          </button>
        </div>
        <nav class="flex flex-col gap-2 p-4 text-sm font-semibold text-slate-700">
          <div v-for="item in navItems" :key="`mobile-${item.key}`" class="rounded-xl">
            <div class="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-slate-50">
              <RouterLink
                v-if="item.to"
                :to="resolveNavLink(item.to)"
                class="flex-1"
                :class="isActive(item) ? 'text-slate-900' : ''"
                @click="closeMobileNav"
              >
                {{ item.name }}
              </RouterLink>
              <span v-else class="flex-1">{{ item.name }}</span>
              <button
                v-if="item.children"
                type="button"
                class="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                @click="toggleMobileDropdown(item.key)"
                :aria-expanded="openMobileDropdown === item.key"
                :aria-label="t('public.actions.toggleSubmenu')"
              >
                <svg
                  class="h-4 w-4 transition duration-150"
                  :class="openMobileDropdown === item.key ? 'rotate-180' : ''"
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
              v-show="openMobileDropdown === item.key"
            >
              <RouterLink
                v-for="child in item.children"
                :key="`${item.key}-${child.key}`"
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
            {{ t('public.actions.fillSurvey') }}
          </button>
          <RouterLink
            v-if="auth.isAuthenticated.value"
            to="/admin"
            class="rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
            @click="closeMobileNav"
          >
            {{ t('public.actions.dashboard') }}
          </RouterLink>

          <button
            v-if="auth.isAuthenticated.value"
            type="button"
            class="rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            @click="handleLogout(); closeMobileNav()"
          >
            {{ t('public.actions.logout') }}
          </button>
        </nav>
      </div>
    </div>

    <div
      v-if="showSurveyPicker"
      class="public-dialog-backdrop"
      role="dialog"
      aria-modal="true"
      @click.self="closeSurveyPicker"
    >
      <div class="public-dialog-panel max-w-xl p-6 sm:p-7">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">{{ t('public.surveyPicker.tag') }}</p>
            <h3 class="text-lg font-semibold text-slate-900">{{ t('public.surveyPicker.title') }}</h3>
            <p class="text-xs text-slate-600">{{ t('public.surveyPicker.desc') }}</p>
          </div>
          <button
            type="button"
            class="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            @click="closeSurveyPicker"
          >
            {{ t('public.actions.close') }}
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
                <p class="text-sm font-semibold text-white">{{ t('public.surveyPicker.alumni.title') }}</p>
                <p class="text-xs text-indigo-50">{{ t('public.surveyPicker.alumni.desc') }}</p>
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
                <p class="text-sm font-semibold text-white">{{ t('public.surveyPicker.user.title') }}</p>
                <p class="text-xs text-indigo-50">{{ t('public.surveyPicker.user.desc') }}</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
