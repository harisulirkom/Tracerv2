import apiClient from './apiClient'

// Berita / artikel
export const getNews = (params = {}) => apiClient.get('/news', params)
export const getNewsDetail = (id) => apiClient.get(`/news/${id}`)
export const createNews = (payload) => apiClient.post('/news', payload)
export const updateNews = (id, payload) => apiClient.put(`/news/${id}`, payload)
export const deleteNews = (id) => apiClient.del(`/news/${id}`)

// CTA / banner homepage
export const getCtas = () => apiClient.get('/cta')
export const updateCta = (payload) => apiClient.put('/cta', payload)

// Hero/homepage content aggregate
export const getHomepageContent = () => apiClient.get('/homepage')
export const updateHomepageContent = (payload) => apiClient.put('/homepage', payload)

export default {
  getNews,
  getNewsDetail,
  createNews,
  updateNews,
  deleteNews,
  getCtas,
  updateCta,
  getHomepageContent,
  updateHomepageContent,
}
