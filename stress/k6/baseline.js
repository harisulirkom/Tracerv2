import { runMixedTraffic, setupContext } from './lib/workload.js'

const stage1 = Number(__ENV.BASELINE_STAGE1_VUS || 200)
const stage2 = Number(__ENV.BASELINE_STAGE2_VUS || 500)

export const options = {
  scenarios: {
    baseline: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: __ENV.BASELINE_STAGE1_DURATION || '2m', target: stage1 },
        { duration: __ENV.BASELINE_STAGE2_DURATION || '5m', target: stage2 },
        { duration: __ENV.BASELINE_RAMPDOWN_DURATION || '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  discardResponseBodies: true,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
    checks: ['rate>0.99'],
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
