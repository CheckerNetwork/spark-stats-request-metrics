import { reportMetric } from "../lib/influx.js";

export const handleRequest = async (request, env) => {
  const url = new URL(request.url);
  const newRequest = new Request(`${env.REQUEST_URL}${url.pathname}${url.search}`, request);

  return await fetch(newRequest);
}

export default {
  async fetch(request, env, ctx) {
    const response = await handleRequest(request, env);
    ctx.waitUntil(reportMetric(request, response, env));
    return response;
  }
}