import { reportRequestMetric } from '../lib/influx.js'

export default {
  async fetch(request, env, ctx, { reportRequestMetric } = { reportRequestMetric }) {
    const response = await fetch(request)
    ctx.waitUntil(reportRequestMetric(request, env))
    return response
  },
}
