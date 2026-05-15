import api, { del, get } from './api'

const unwrapResource = (payload) => payload?.data ?? payload
const unwrapCollection = (payload) => {
  const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []
  return {
    items: list,
    meta: payload?.meta || null,
    links: payload?.links || null,
  }
}

const buildFormData = (payload = {}) => {
  const form = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (value instanceof File) {
      form.append(key, value)
      return
    }
    form.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value)
  })
  return form
}

const multipartConfig = {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
}

export const getActivePopupBanner = async () => unwrapResource(await get('/popup-banner/active'))

export const getPopupBanners = async (params = {}) => unwrapCollection(await get('/admin/popup-banners', { params }))

export const createPopupBanner = async (payload) => {
  const response = await api.post('/admin/popup-banners', buildFormData(payload), multipartConfig)
  return unwrapResource(response?.data)
}

export const updatePopupBanner = async (id, payload) => {
  const response = await api.post(`/admin/popup-banners/${id}`, buildFormData(payload), multipartConfig)
  return unwrapResource(response?.data)
}

export const deletePopupBanner = (id) => del(`/admin/popup-banners/${id}`)

export default {
  getActivePopupBanner,
  getPopupBanners,
  createPopupBanner,
  updatePopupBanner,
  deletePopupBanner,
}
