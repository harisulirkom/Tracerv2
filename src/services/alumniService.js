import { get, post, put } from './api'

export const getAlumni = (params = {}, config = {}) => get('/admin/alumni', { params, ...config })
export const getAlumniById = (id) => get(`/alumni/${id}`)
export const updateAlumni = async (id, payload = {}) => {
  const endpoints = [`/admin/alumni/${id}`, `/alumni/${id}`]
  let lastError = null

  for (const endpoint of endpoints) {
    try {
      return await put(endpoint, payload)
    } catch (err) {
      lastError = err
      const status = err?.response?.status
      const isNetworkError = !err?.response

      if (status !== 404 && status !== 405 && !isNetworkError) {
        throw err
      }

      try {
        // Fallback for infra that blocks PUT at proxy/CORS layer.
        return await post(endpoint, { ...payload, _method: 'PUT' })
      } catch (fallbackErr) {
        lastError = fallbackErr
        const fallbackStatus = fallbackErr?.response?.status
        const fallbackNetworkError = !fallbackErr?.response
        if (fallbackStatus !== 404 && fallbackStatus !== 405 && !fallbackNetworkError) {
          throw fallbackErr
        }
      }
    }
  }

  throw lastError || new Error('Gagal memperbarui data alumni.')
}
export const searchAlumni = (query = {}, options = {}) => {
  const params = { ...query }
  if (params.name) {
    params.nama = params.name
    delete params.name
  }
  if (params.dob) {
    params.tanggal_lahir = params.dob
    delete params.dob
  }
  return get('/alumni/search', { params, ...options })
}

// Lookup helper yang toleran 404 untuk NIM
export const lookupAlumniByNim = async (nim) => {
  if (!nim) return null
  const requestConfig = { skipAuthRedirect: true }
  const encoded = encodeURIComponent(String(nim).trim())
  try {
    return await get(`/alumni/lookup/${encoded}`, requestConfig)
  } catch (err) {
    if (err?.response?.status && err.response.status !== 404) throw err
  }

  try {
    return await get(`/alumni/${encoded}`, requestConfig)
  } catch (err) {
    if (err?.response?.status && err.response.status !== 404) throw err
  }

  try {
    return await get('/alumni', { params: { nim }, ...requestConfig })
  } catch (err) {
    if (err?.response?.status && err.response.status !== 404) throw err
  }

  try {
    return await searchAlumni({ nim }, requestConfig)
  } catch (err) {
    if (err?.response?.status && err.response.status !== 404) throw err
  }

  return null
}
export const searchAlumniByNim = (nim, options = {}) => searchAlumni({ nim }, options)
export const searchAlumniByEmail = (email, options = {}) => searchAlumni({ email }, options)

export default {
  getAlumni,
  getAlumniById,
  updateAlumni,
  searchAlumni,
  searchAlumniByNim,
  searchAlumniByEmail,
}
