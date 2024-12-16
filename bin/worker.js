import { reportRequestMetrics as defaultReportRequestMetric } from '../lib/influx.js'

export default {
  async fetch(request, env, ctx, { reportRequestMetrics = defaultReportRequestMetric } = {}) {
    const response = await fetch(request)
    ctx.waitUntil(reportRequestMetrics(request, env))
    return response
  },
}
