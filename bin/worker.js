import { handleRequest } from "../lib/request";
import { reportMetric } from "../lib/metrics";

export default {
  async fetch(request, env, ctx) {
    let response;
    const cache = caches.default;

    if (request.method === 'GET') {
      response = await cache.match(request);
      if (!response) {
        response = await handleRequest(request, env);
        ctx.waitUntil(cache.put(request, response.clone()));
      }

    } else {
      response = await handleRequest(request, env);
    }

    // report metrics for original request
    ctx.waitUntil(reportMetric(request, response, env));
    return response;
  }
}