import { reportMetric } from "../lib/influx.js";

export default {
  async fetch(request, env, ctx) {
    const response = await fetch(request);
    ctx.waitUntil(
      caches.default.put(request, response.clone())
    )
    ctx.waitUntil(
      reportMetric(request, env)
    );
    return response;
  }
}