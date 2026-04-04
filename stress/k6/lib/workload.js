import { check, sleep } from 'k6'
import {
  ENABLE_EXPORT,
  EXPORT_FORMAT,
  SUMMARY_WEIGHT,
  RESPONSES_WEIGHT,
  EXPORT_WEIGHT,
  SUMMARY_ENDPOINT_PATH,
  randomThinkTime,
} from './config.js'
import {
  resolveToken,
  resolveQuestionnaireId,
  getAccreditationSummary,
  getQuestionnaireResponses,
  triggerResponsesExport,
  hasSummaryData,
} from './client.js'

const toNumber = (value, fallback) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const statusIn = (response, statuses = []) => {
  if (!response) return false
  return statuses.includes(Number(response.status))
}

const runSummaryFlow = (state) => {
  const response = getAccreditationSummary(state.token)
  const assertions = {
    'summary status 200': (res) => statusIn(res, [200]),
  }
  if (SUMMARY_ENDPOINT_PATH.includes('accreditation-summary')) {
    assertions['summary has payload'] = (res) => statusIn(res, [200]) && hasSummaryData(res)
  }
  check(response, assertions)
}

const runResponsesFlow = (state) => {
  if (!state.questionnaireId) {
    runSummaryFlow(state)
    return
  }
  const response = getQuestionnaireResponses(state.token, state.questionnaireId)
  check(response, {
    'responses status 200': (res) => statusIn(res, [200]),
  })
}

const runExportFlow = (state) => {
  if (!state.questionnaireId) {
    runSummaryFlow(state)
    return
  }
  const response = triggerResponsesExport(state.token, state.questionnaireId, EXPORT_FORMAT)
  check(response, {
    'export accepted': (res) => statusIn(res, [200, 201, 202]),
  })
}

const chooseFlow = (weights) => {
  const summaryWeight = Math.max(0, toNumber(weights.summary, SUMMARY_WEIGHT))
  const responsesWeight = Math.max(0, toNumber(weights.responses, RESPONSES_WEIGHT))
  const exportWeight = Math.max(0, toNumber(weights.export, EXPORT_WEIGHT))
  const total = summaryWeight + responsesWeight + exportWeight
  const roll = Math.random() * (total > 0 ? total : 1)
  if (roll < summaryWeight) return 'summary'
  if (roll < summaryWeight + responsesWeight) return 'responses'
  return 'export'
}

export const setupContext = () => {
  const token = resolveToken()
  const questionnaireId = resolveQuestionnaireId(token)
  return {
    token,
    questionnaireId,
  }
}

export const runMixedTraffic = (state, overrides = {}) => {
  const enableExport = Object.prototype.hasOwnProperty.call(overrides, 'enableExport')
    ? Boolean(overrides.enableExport)
    : ENABLE_EXPORT
  const weights = {
    summary: overrides.summaryWeight,
    responses: overrides.responsesWeight,
    export: enableExport ? overrides.exportWeight : 0,
  }
  const flow = chooseFlow(weights)
  if (flow === 'summary') {
    runSummaryFlow(state)
  } else if (flow === 'responses') {
    runResponsesFlow(state)
  } else {
    runExportFlow(state)
  }
  sleep(randomThinkTime())
}

export const runSmokeFlow = (state) => {
  runSummaryFlow(state)
  runResponsesFlow(state)
  sleep(0.2)
}
