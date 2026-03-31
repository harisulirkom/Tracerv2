import { get } from './api'
import { DASHBOARD_TIMEOUT_MS } from './requestTimeout'

/**
 * Memanggil endpoint agregasi semua statistik tracer study.
 * @param {Object} filters Query params yang menyaring data untuk fakultas, prodi, tahun lulus, dan periode.
 */
export const getTracerInsights = (filters = {}, config = {}) => {
  const safeFilters = {
    ...filters,
    questionnaire_id: filters.questionnaire_id ?? filters.questionnaireId,
  }
  return get('/dashboard/tracer/insights', { params: safeFilters, timeout: DASHBOARD_TIMEOUT_MS, ...config })
}

export default {
  getTracerInsights,
}
