import { reactive } from 'vue'
import { get } from '@/services/api'
import { DASHBOARD_TIMEOUT_MS } from '@/services/requestTimeout'

const state = reactive({
  loading: false,
  error: null,
  lastFetched: null,
  payload: {},
})

const getEndpoint = () => import.meta.env.VITE_DASHBOARD_DATA_URL || '/api/dashboard.json'
const canUseApi = !!import.meta.env.VITE_API_BASE_URL

const fetchDashboardData = async () => {
  if (state.loading) return
  state.loading = true
  state.error = null
  try {
    if (canUseApi) {
      const resp = await get('/dashboard/summary', { timeout: DASHBOARD_TIMEOUT_MS })
      state.payload = resp?.data ?? resp ?? {}
    } else {
      const response = await fetch(getEndpoint(), { cache: 'no-store' })
      if (!response.ok) {
        throw new Error(`Gagal memuat dashboard (${response.status})`)
      }
      const data = await response.json()
      state.payload = data || {}
    }
    state.lastFetched = Date.now()
  } catch (error) {
    state.error = error.message || 'Terjadi kesalahan saat memuat data dashboard'
  } finally {
    state.loading = false
  }
}

export const useDashboardData = () => ({
  dashboard: state,
  fetchDashboardData,
  refreshDashboardData: fetchDashboardData,
})
