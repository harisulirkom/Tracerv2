import { runSmokeFlow, setupContext } from './lib/workload.js'

const vus = Number(__ENV.SMOKE_VUS || 20)
const duration = String(__ENV.SMOKE_DURATION || '1m')

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus,
      duration,
    },
  },
  discardResponseBodies: false,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
    checks: ['rate>0.99'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
}

export function setup() {
  return setupContext()
}

export default function (state) {
  runSmokeFlow(state)
}
