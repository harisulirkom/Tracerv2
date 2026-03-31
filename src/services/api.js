import axios from 'axios'
import { API_TIMEOUT_MS, buildTimeoutMessage, isTimeoutError } from './requestTimeout'

const baseURL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

let authToken = null
let unauthorizedHandler = null

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: API_TIMEOUT_MS,
})

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const skipAuthRedirect = Boolean(error.config?.skipAuthRedirect)
    if (isTimeoutError(error)) {
      error.message = buildTimeoutMessage(error.config?.timeout)
    }
    if (status === 401 && !skipAuthRedirect && typeof unauthorizedHandler === 'function') {
      unauthorizedHandler(error)
    }
    return Promise.reject(error)
  }
)

export const setAuthToken = (token) => {
  authToken = token
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}

export const clearAuthToken = () => {
  authToken = null
  delete api.defaults.headers.common.Authorization
}

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = typeof handler === 'function' ? handler : null
}

const bootstrapAuthToken = () => {
  if (authToken || typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem('tracer_auth_token')
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (parsed?.token) {
      setAuthToken(parsed.token)
    }
  } catch (e) {
    // abaikan jika tidak bisa mem-parsing token lokal
  }
}

bootstrapAuthToken()

const unwrap = (promise) => promise.then((res) => res?.data ?? res)

export const get = (url, config = {}) => unwrap(api.get(url, config))
export const post = (url, data, config = {}) => unwrap(api.post(url, data, config))
export const put = (url, data, config = {}) => unwrap(api.put(url, data, config))
export const patch = (url, data, config = {}) => unwrap(api.patch(url, data, config))
export const del = (url, config = {}) => unwrap(api.delete(url, config))

export default api
