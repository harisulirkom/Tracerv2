import { get, post, put, del } from './api'

export const getJobs = (params = {}) => get('/jobs', { params })

export const getJobDetail = (id) => get(`/jobs/${id}`)

export const createJob = (payload) => post('/jobs', payload)

export const updateJob = (id, payload) => put(`/jobs/${id}`, payload)

export const deleteJob = (id) => del(`/jobs/${id}`)

export const publishJob = (id) => post(`/jobs/${id}/publish`)

export const closeJob = (id) => post(`/jobs/${id}/close`)

export default {
  getJobs,
  getJobDetail,
  createJob,
  updateJob,
  deleteJob,
  publishJob,
  closeJob,
}
