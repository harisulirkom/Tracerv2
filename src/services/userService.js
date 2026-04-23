import { get, post, put, del, setAuthToken, clearAuthToken } from './api'

export const login = async (credentials) => {
  const data = await post('/login', credentials, {
    timeout: 10000,
    skipAuthRedirect: true,
  })
  if (data?.token) setAuthToken(data.token)
  return data
}

export const logout = () => post('/logout').finally(() => clearAuthToken())

export const getProfile = () => get('/user')

export const updateProfile = (payload) =>
  put('/user', payload, {
    timeout: 60000,
  })

export const getUsers = (params = {}) => get('/admin/users', { params })

export const createUser = (payload) => post('/admin/users', payload)

export const updateUser = (id, payload) => put(`/admin/users/${id}`, payload)

export const deleteUser = (id) => del(`/admin/users/${id}`)

export const resetPassword = (id, payload) =>
  post(`/admin/users/${id}/reset-password`, payload)

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
