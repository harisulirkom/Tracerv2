import { get, post, put, del } from './api'

export const getAll = (params = {}) => get('/questionnaires', { params })
export const getById = (id) => get(`/questionnaires/${id}`)
export const create = (data) => post('/questionnaires', data)
export const update = (id, data) => put(`/questionnaires/${id}`, data)
export const remove = async (id) => {
  const safeId = encodeURIComponent(String(id ?? '').trim())
  const endpoint = `/questionnaires/${safeId}`
  try {
    return await del(endpoint)
  } catch (err) {
    const status = err?.response?.status
    const isNetworkError = !err?.response
    if (!isNetworkError && ![405, 419, 500, 502, 503, 504].includes(status)) {
      throw err
    }
    const payload = new URLSearchParams()
    payload.set('_method', 'DELETE')
    return post(endpoint, payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
  }
}
export const getQuestions = (id, params = {}) => get(`/questionnaires/${id}/questions`, { params })

export default {
  getAll,
  getById,
  create,
  update,
  delete: remove,
  getQuestions,
}
