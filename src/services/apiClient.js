const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

let authToken = null
let unauthorizedHandler = null

const buildUrl = (path, query) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const base = /^https?:\/\//i.test(API_BASE_URL)
    ? API_BASE_URL
    : `${window.location.origin}${API_BASE_URL}`
  const url = new URL(`${base}${normalizedPath}`)
  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, v))
      } else {
        url.searchParams.set(key, value)
      }
    })
  }
  return url.toString()
}

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await response.json().catch(() => ({})) : await response.text()

  if (!response.ok) {
    if (response.status === 401 && typeof unauthorizedHandler === 'function') {
      unauthorizedHandler()
    }
    const message = payload?.message || payload?.error || response.statusText || 'Request failed'
    const error = new Error(message)
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}

const request = async (path, options = {}) => {
  const { method = 'GET', body, query, headers = {} } = options
  const url = buildUrl(path, query)

  const fetchOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (authToken) {
    fetchOptions.headers.Authorization = `Bearer ${authToken}`
  }

  if (body !== undefined && body !== null && method !== 'GET') {
    fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body)
  }

  const response = await fetch(url, fetchOptions)
  return handleResponse(response)
}

export const setAuthToken = (token) => {
  authToken = token
}

export const clearAuthToken = () => {
  authToken = null
}

export const setUnauthorizedHandler = (fn) => {
  unauthorizedHandler = typeof fn === 'function' ? fn : null
}

export const get = (path, query, config = {}) => request(path, { ...config, method: 'GET', query })
export const post = (path, body, config = {}) => request(path, { ...config, method: 'POST', body })
export const put = (path, body, config = {}) => request(path, { ...config, method: 'PUT', body })
export const patch = (path, body, config = {}) => request(path, { ...config, method: 'PATCH', body })
export const del = (path, config = {}) => request(path, { ...config, method: 'DELETE' })

export default {
  get,
  post,
  put,
  patch,
  del,
  setAuthToken,
  clearAuthToken,
  setUnauthorizedHandler,
}
