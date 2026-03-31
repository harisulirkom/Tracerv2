import { get, post, put, del } from './api'

export const getAll = (params = {}) => get('/questionnaires', { params })
export const getById = (id) => get(`/questionnaires/${id}`)
export const create = (data) => post('/questionnaires', data)
export const update = (id, data) => put(`/questionnaires/${id}`, data)
export const remove = (id) => del(`/questionnaires/${id}`)
export const getQuestions = (id, params = {}) => get(`/questionnaires/${id}/questions`, { params })

export default {
  getAll,
  getById,
  create,
  update,
  delete: remove,
  getQuestions,
}
