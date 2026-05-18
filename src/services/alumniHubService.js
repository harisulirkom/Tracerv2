import api, { get, post, put } from './api'

const unwrapResource = (payload) => payload?.data ?? payload

export const getAlumniHubContent = async () => unwrapResource(await get('/alumni-hub'))

export const getAdminAlumniHubContent = async () => unwrapResource(await get('/admin/alumni-hub'))

export const updateAdminAlumniHubContent = async (content) => {
  try {
    return unwrapResource(await put('/admin/alumni-hub', { content }))
  } catch (error) {
    const status = error?.response?.status
    if ([405, 419, 501].includes(status) || error?.code === 'ERR_NETWORK') {
      return unwrapResource(await post('/admin/alumni-hub', { content, _method: 'PUT' }))
    }
    throw error
  }
}

export const uploadAlumniHubImage = async (file) => {
  const form = new FormData()
  form.append('image', file)
  const response = await api.post('/admin/alumni-hub/images', form, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return unwrapResource(response?.data)
}

export default {
  getAlumniHubContent,
  getAdminAlumniHubContent,
  updateAdminAlumniHubContent,
  uploadAlumniHubImage,
}
