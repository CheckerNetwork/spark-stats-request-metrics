import { InfluxDB, Point } from '@influxdata/influxdb-client';

const INFLUX_URL = process.env.INFLUX_URL || 'http://localhost:8086';
const INFLUX_TOKEN = process.env.INFLUX_TOKEN || '';
const INFLUX_ORG = process.env.INFLUX_ORG || '';
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || '';

const client = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN });

// global vars
async function handleRequest(request, env, ctx) {
  // TODO: Replace
  return await fetch('http://httpbin.org/status/200');
}

async function formatMetricPoint(request) {
  const url = new URL(request.url);
  const today = new Date();

  const origin = request.headers.get("origin") ?? "";
  const ip = request.headers.get("cf-connecting-ip") ?? "";
  const userAgent = request.headers.get("user-agent") ?? "";
  const country = request.headers.get("cf-ipcountry") ?? "unknown";
  const cache = request.headers.get("cf-cache-status") ?? "unknown";
  const service = new URL(origin).hostname.replaceAll(".", "-");

  /**
 * For every origin that reports a page_view, visitors get a unique ID every
 * day. We don't log their IPs / UserAgents, but we do use them to calculate
 * their IDs. Visitor IDs let us determine uniqueness.
 *
 * This is also the strategy Plausible uses, and is a great balance between
 * usefulness and privacy.
 */
  const visitorDigest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(today.toDateString() + ip + userAgent),
  );
  const visitor = Array.from(new Uint8Array(visitorDigest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const point = new Point('request')
    .tag('url', url.toString())
    .tag('hostname', url.hostname)
    .tag('pathname', url.pathname)
    .tag('method', request.method)
    .tag('cf_cache', cache)
    .tag('country', country)
    .tag('service', service)
    .tag('visitor', visitor)
    .timestamp(today);

  return point;
}

async function handleMetrics(events, env, ctx) {
  const writeApi = client.getWriteApi(INFLUX_ORG, INFLUX_BUCKET);
  for (const event of events) {
    const point = formatMetricPoint(event.request);

    console.log(point)
    writeApi.writePoint(point);

  }

  ctx.waitUntil(
    writeApi.close()
  )
}

export default {
  fetch: handleRequest,
  tail: handleMetrics,
}