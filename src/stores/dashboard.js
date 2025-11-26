import { reactive } from 'vue'
import apiClient from '@/services/apiClient'

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
      const resp = await apiClient.get('/dashboard/summary')
      state.payload = resp?.data || resp || {}
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
