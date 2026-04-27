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

const shouldRetryProfileUpdateWithPost = (error) => {
  const status = Number(error?.response?.status || 0)
  if (!status) return true
  return [403, 405, 408, 413, 429, 499, 500, 501, 502, 503, 504].includes(status)
}

export const updateProfile = async (payload) => {
  try {
    return await put('/user', payload, {
      timeout: 60000,
    })
  } catch (error) {
    if (!shouldRetryProfileUpdateWithPost(error)) {
      throw error
    }

    return post(
      '/user',
      {
        ...payload,
        _method: 'PUT',
      },
      {
        timeout: 60000,
        headers: {
          'X-HTTP-Method-Override': 'PUT',
        },
      },
    )
  }
}

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
