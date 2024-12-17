import { reportRequestMetrics as reportRequestMetricsToInflux } from '../lib/influx.js'

export default {
  async fetch(request, env, ctx, { reportRequestMetrics = reportRequestMetricsToInflux } = {}) {
    const response = await fetch(request)
    ctx.waitUntil(reportRequestMetrics(request, env))
    return response
  },
}
