import { runMixedTraffic, setupContext } from './lib/workload.js'

const stage1 = Number(__ENV.STRESS_STAGE1_VUS || 1000)
const stage2 = Number(__ENV.STRESS_STAGE2_VUS || 3000)
const stage3 = Number(__ENV.STRESS_STAGE3_VUS || 5000)

export const options = {
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: __ENV.STRESS_STAGE1_DURATION || '3m', target: stage1 },
        { duration: __ENV.STRESS_STAGE2_DURATION || '5m', target: stage2 },
        { duration: __ENV.STRESS_STAGE3_DURATION || '5m', target: stage3 },
        { duration: __ENV.STRESS_RAMPDOWN_DURATION || '3m', target: 0 },
      ],
      gracefulRampDown: '45s',
    },
  },
  discardResponseBodies: true,
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<2500', 'p(99)<5000'],
    checks: ['rate>0.98'],
  },
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
}

export function setup() {
  return setupContext()
}

export default function (state) {
  runMixedTraffic(state, {
    enableExport: __ENV.ENABLE_EXPORT === '1',
  })
}
