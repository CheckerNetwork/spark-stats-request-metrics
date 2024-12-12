import zlib from 'node:zlib';
import { promisify } from 'node:util';

/*
* Sends compressed request metrics to InfluxDB
* https://docs.influxdata.com/enterprise_influxdb/v1/guides/write_data/
*/
export const reportMetric = async (request, response, env) => {
  const compress = promisify(zlib.gzip);

  // Define API endpoint and headers
  const url = `${env.INFLUX_URL}/api/v2/write?&bucket=${env.INFLUX_DATABASE}&precision=ms`;

  return fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${env.INFLUX_TOKEN}`,
      'Content-Encoding': 'gzip',
      'Content-Type': 'text/plain; charset=utf-8',
    },
    body: await compress(createMetricsFromRequest(request, response, env)),
  })
}

/*
* Returns request metrics in InfluxDB line protocol format
* https://docs.influxdata.com/influxdb/cloud/reference/syntax/line-protocol/ 
*/
export const createMetricsFromRequest = (request, response = {}, env) => {
  const url = new URL(request.url);
  const timestamp = Date.now();
  const apiKey = request.headers.get('api-key') || 
    url.searchParams.get('api-key') || (
      request.headers.get('Authorization')?.startsWith('Bearer ') 
      ? request.headers.get('Authorization').substring(7) 
      : 'unknown'
    );
  const cfCacheStatus = response?.headers.get('CF-Cache-Status') ?? 'miss'
  const formattedUrl = url.toString().replaceAll('=', '\\=');

  // We're setting field value to 1 to count the number of requests
  return `${env.INFLUX_METRIC_NAME},status_code=${response.status},url=${formattedUrl},hostname=${url.hostname},pathname="${url.pathname}",method=${request.method},cf_cache_status=${cfCacheStatus},api_key=${apiKey} value=1 ${timestamp}`
}