import apiClient from './apiClient'

export const getJobs = (params = {}) => apiClient.get('/jobs', params)

export const getJobDetail = (id) => apiClient.get(`/jobs/${id}`)

export const createJob = (payload) => apiClient.post('/jobs', payload)

export const updateJob = (id, payload) => apiClient.put(`/jobs/${id}`, payload)

export const deleteJob = (id) => apiClient.del(`/jobs/${id}`)

export const publishJob = (id) => apiClient.post(`/jobs/${id}/publish`)

export const closeJob = (id) => apiClient.post(`/jobs/${id}/close`)

export default {
  getJobs,
  getJobDetail,
  createJob,
  updateJob,
  deleteJob,
  publishJob,
  closeJob,
}
