import apiClient, { setAuthToken, clearAuthToken } from './apiClient'

export const login = async (credentials) => {
  const data = await apiClient.post('/auth/login', credentials)
  if (data?.token) setAuthToken(data.token)
  return data
}

export const logout = () => {
  clearAuthToken()
  return Promise.resolve()
}

export const getProfile = () => apiClient.get('/auth/me')

export const updateProfile = (payload) => apiClient.put('/auth/me', payload)

export const getUsers = (params = {}) => apiClient.get('/admin/users', params)

export const createUser = (payload) => apiClient.post('/admin/users', payload)

export const updateUser = (id, payload) => apiClient.put(`/admin/users/${id}`, payload)

export const deleteUser = (id) => apiClient.del(`/admin/users/${id}`)

export const resetPassword = (id, payload) =>
  apiClient.post(`/admin/users/${id}/reset-password`, payload)

export default {
  login,
  logout,
  getProfile,
  updateProfile,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
}
