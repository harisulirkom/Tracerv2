import apiClient from './apiClient'

export const getAlumni = (params = {}) => apiClient.get('/alumni', params)
export const getAlumniById = (id) => apiClient.get(`/alumni/${id}`)
export const searchAlumni = (query = {}) => apiClient.get('/alumni/search', query)
export const searchAlumniByNim = (nim) => searchAlumni({ nim })
export const searchAlumniByEmail = (email) => searchAlumni({ email })

export default {
  getAlumni,
  getAlumniById,
  searchAlumni,
  searchAlumniByNim,
  searchAlumniByEmail,
}
