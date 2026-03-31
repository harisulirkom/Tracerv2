import './assets/main.css'

import { createApp, effectScope, watch } from 'vue'
import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from '@/services/api'
import { useAuth } from './stores/auth'
import autoRevealDirective from './directives/autoReveal'
import i18n from './i18n'

const auth = useAuth()
const MOTION_PRESET_KEY = 'tracer_motion_preset'
const SUPPORTED_MOTION_PRESETS = new Set(['normal', 'snappy'])
const IDLE_LIMIT_MS = 30 * 60 * 1000
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']
let idleTimer = null
let lastActivity = Date.now()

const normalizeMotionPreset = (value) => {
  const preset = String(value || '').trim().toLowerCase()
  return SUPPORTED_MOTION_PRESETS.has(preset) ? preset : null
}

const applyMotionPreset = (value, options = {}) => {
  const { persist = true } = options
  const preset = normalizeMotionPreset(value) || 'normal'

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.motionPreset = preset
  }

  if (persist && typeof window !== 'undefined') {
    window.localStorage.setItem(MOTION_PRESET_KEY, preset)
  }

  return preset
}

const getRedirectTarget = () => {
  const current = router.currentRoute.value
  return current?.fullPath && current.fullPath !== '/login' ? current.fullPath : '/'
}

const shouldRedirectToLogin = () => {
  const current = router.currentRoute.value
  if (current?.meta?.requiresAuth) return true
  const path = String(current?.path || '')
  return path.startsWith('/admin')
}

const performLogout = (reason = '', redirectToLogin = true) => {
  auth.logout()
  if (!redirectToLogin) return
  const redirect = getRedirectTarget()
  const query = reason ? { redirect, reason } : { redirect }
  router.push({ path: '/login', query }).catch(() => {})
}

const scheduleIdleLogout = () => {
  if (idleTimer) {
    clearTimeout(idleTimer)
  }
  if (!auth.isAuthenticated.value) return
  const elapsed = Date.now() - lastActivity
  const remaining = Math.max(0, IDLE_LIMIT_MS - elapsed)
  idleTimer = setTimeout(handleIdleTimeout, remaining)
}

const handleIdleTimeout = () => {
  if (!auth.isAuthenticated.value) return
  const idleDuration = Date.now() - lastActivity
  if (idleDuration >= IDLE_LIMIT_MS) {
    performLogout('idle')
    return
  }
  scheduleIdleLogout()
}

const markActivity = () => {
  if (!auth.isAuthenticated.value) return
  lastActivity = Date.now()
  scheduleIdleLogout()
}

if (typeof window !== 'undefined') {
  const queryPreset = normalizeMotionPreset(new URLSearchParams(window.location.search).get('motion'))
  const storedPreset = normalizeMotionPreset(window.localStorage.getItem(MOTION_PRESET_KEY))
  applyMotionPreset(queryPreset || storedPreset || 'normal', { persist: true })

  // Dev helper: window.__setMotionPreset('normal' | 'snappy')
  window.__setMotionPreset = (preset) => {
    const nextPreset = applyMotionPreset(preset, { persist: true })
    window.location.reload()
    return nextPreset
  }

  ACTIVITY_EVENTS.forEach((eventName) => {
    window.addEventListener(eventName, markActivity, { passive: true })
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      markActivity()
    }
  })
}

setUnauthorizedHandler(() => {
  if (!auth.isAuthenticated.value) return
  const redirectToLogin = shouldRedirectToLogin()
  performLogout('unauthorized', redirectToLogin)
})

const scope = effectScope()
scope.run(() => {
  watch(
    () => auth.isAuthenticated.value,
    (isAuthed) => {
      if (isAuthed) {
        lastActivity = Date.now()
        scheduleIdleLogout()
      } else if (idleTimer) {
        clearTimeout(idleTimer)
        idleTimer = null
      }
    },
    { immediate: true },
  )
})

const app = createApp(App)
app.directive('auto-reveal', autoRevealDirective)
app.use(i18n)
app.use(router).mount('#app')
