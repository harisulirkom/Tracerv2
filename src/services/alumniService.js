import { get, put } from './api'

export const getAlumni = (params = {}, config = {}) => get('/admin/alumni', { params, ...config })
export const getAlumniById = (id) => get(`/alumni/${id}`)
export const updateAlumni = (id, payload) => put(`/admin/alumni/${id}`, payload)
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
