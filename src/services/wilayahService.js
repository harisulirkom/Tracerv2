import api from './api'

let provincesCache = null
const regenciesCache = new Map()

export const getProvinces = async () => {
  if (provincesCache) {
    return provincesCache
  }
  const response = await api.get('/wilayah/provinces')
  const data = response?.data
  provincesCache = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
  return provincesCache
}

export const getRegenciesByProvince = async (code) => {
  if (!code) return []
  if (regenciesCache.has(code)) {
    return regenciesCache.get(code)
  }
  const response = await api.get(`/wilayah/regencies/${code}`)
  const data = response?.data
  const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
  regenciesCache.set(code, list)
  return list
}

export default {
  getProvinces,
  getRegenciesByProvince,
}
