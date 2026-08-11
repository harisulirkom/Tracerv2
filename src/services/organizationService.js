import api, { del, get, put } from './api'

const unwrapResource = (payload) => payload?.data ?? payload
const unwrapCollection = (payload) =>
  Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []

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
  headers: { 'Content-Type': 'multipart/form-data' },
}

export const getOrganizationStructure = async () => unwrapCollection(await get('/organization-structure'))

export const getAdminOrganizationMembers = async () =>
  unwrapCollection(await get('/admin/organization-members'))

export const createOrganizationMember = async (payload) => {
  const response = await api.post('/admin/organization-members', buildFormData(payload), multipartConfig)
  return unwrapResource(response?.data)
}

export const updateOrganizationMember = async (id, payload) => {
  const response = await api.post(
    `/admin/organization-members/${id}`,
    buildFormData(payload),
    multipartConfig,
  )
  return unwrapResource(response?.data)
}

export const reorderOrganizationMembers = async (items) =>
  unwrapCollection(await put('/admin/organization-members-reorder', { items }))

export const deleteOrganizationMember = (id) => del(`/admin/organization-members/${id}`)

export default {
  getOrganizationStructure,
  getAdminOrganizationMembers,
  createOrganizationMember,
  updateOrganizationMember,
  reorderOrganizationMembers,
  deleteOrganizationMember,
}
