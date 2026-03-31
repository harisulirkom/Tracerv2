import { get, post, put, del } from './api'

// Berita / artikel
export const getNews = (params = {}) => get('/news', { params })
export const getNewsDetail = (id) => get(`/news/${id}`)
export const createNews = (payload) => post('/news', payload)
export const updateNews = (id, payload) => put(`/news/${id}`, payload)
export const deleteNews = (id) => del(`/news/${id}`)

// CTA / banner homepage
export const getCtas = () => get('/cta')
export const updateCta = (payload) => put('/cta', payload)

// Hero/homepage content aggregate
export const getHomepageContent = () => get('/homepage')
export const updateHomepageContent = (payload) => put('/homepage', payload)

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
