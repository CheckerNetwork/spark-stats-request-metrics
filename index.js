import { InfluxDBClient, Point } from '@influxdata/influxdb3-client';

const INFLUX_HOST = process.env.INFLUX_HOST || 'http://localhost:8086';
const INFLUX_TOKEN = process.env.INFLUX_TOKEN || '';
const INFLUX_DATABASE = process.env.INFLUX_DATABASE || '';

async function handleRequest(request, env, ctx) {
  return await fetch(request);
}

async function formatMetricPoint(request) {
  const url = new URL(request.url);
  const today = new Date();

  const origin = request.headers.get("origin") ?? "";
  const cache = request.headers.get("cf-cache-status") ?? "unknown";
  const service = new URL(origin).hostname.replaceAll(".", "-");


  const point = new Point('request')
    .tag('url', url.toString())
    .tag('hostname', url.hostname)
    .tag('pathname', url.pathname)
    .tag('method', request.method)
    .tag('cf_cache', cache)
    .tag('service', service)
    .timestamp(today);

  return point;
}

async function handleMetrics(events, env, ctx) {
  const client = new InfluxDBClient({ host: INFLUX_HOST, token: INFLUX_TOKEN });
  for (const event of events) {
    const point = formatMetricPoint(event.request);

    console.log(point)
    await client.write(INFLUX_DATABASE, point);
  }

  await writeApi.close()
}

export default {
  fetch: handleRequest,
  tail: handleMetrics,
}