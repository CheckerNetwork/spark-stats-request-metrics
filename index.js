import { InfluxDBClient, Point } from '@influxdata/influxdb3-client';

const INFLUX_HOST = process.env.INFLUX_HOST || 'http://localhost:8086';
const INFLUX_TOKEN = process.env.INFLUX_TOKEN || '';
const INFLUX_DATABASE = process.env.INFLUX_DATABASE || '';

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

async function reportMetric(request) {
  const client = new InfluxDBClient({ host: INFLUX_HOST, token: INFLUX_TOKEN });
  const point = formatMetricPoint(request);
  await client.write(INFLUX_DATABASE, point);
  await client.close()
}

export default {
  async fetch(request, env, ctx) {
    const resp = await fetch(request);
    ctx.waitUntil(reportMetric(request));
    return resp;
  }
}