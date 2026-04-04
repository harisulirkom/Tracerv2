import { runMixedTraffic, setupContext } from './lib/workload.js'

const vus = Number(__ENV.SOAK_VUS || 1000)
const duration = String(__ENV.SOAK_DURATION || '45m')

export const options = {
  scenarios: {
    soak: {
      executor: 'constant-vus',
      vus,
      duration,
      gracefulStop: '45s',
    },
  },
  discardResponseBodies: true,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1800', 'p(99)<3500'],
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
