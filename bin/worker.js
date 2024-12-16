import { reportRequestMetric as defaultReportRequestMetric } from '../lib/influx.js'

export default {
  async fetch(request, env, ctx, { reportRequestMetric = defaultReportRequestMetric } = {}) {
    const response = await fetch(request)
    ctx.waitUntil(reportRequestMetric(request, env))
    return response
  },
}
