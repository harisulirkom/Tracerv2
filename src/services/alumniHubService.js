import { get, put } from './api'

const unwrapResource = (payload) => payload?.data ?? payload

export const getAlumniHubContent = async () => unwrapResource(await get('/alumni-hub'))

export const getAdminAlumniHubContent = async () => unwrapResource(await get('/admin/alumni-hub'))

export const updateAdminAlumniHubContent = async (content) =>
  unwrapResource(await put('/admin/alumni-hub', { content }))

export default {
  getAlumniHubContent,
  getAdminAlumniHubContent,
  updateAdminAlumniHubContent,
}
