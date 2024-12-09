import zlib from 'node:zlib';
import { promisify } from 'node:util';

function getRequestData(request, response, startTime, endTime) {
  const timestamp = Date.now();
  const originResponse = response || {};
  const url = new URL(request.url);
  const apiKey = request.headers.get('api-key') || url.searchParams.get('api-key') || (request.headers.get('Authorization')?.startsWith('Bearer ') ? request.headers.get('Authorization').substring(7) : 'unknown');

  return {
    'timestamp': timestamp,
    'url': request.url,
    'method': request.method,
    'status': originResponse.status,
    'originTime': (endTime - startTime),
    'cfCache': (originResponse) ? (response.headers.get('CF-Cache-Status') || 'miss') : 'miss',
    'apiKey': apiKey,
  };
}

function formatRequestData(data, env) {
  const url = new URL(data.url);
  // We're setting field value to 1 to count the number of requests
  return `${env.INFLUX_METRIC},status_code=${data.status},url=${data.url},hostname=${url.hostname},pathname=${url.pathname},method=${data.method},cf_cache=${data.cfCache},api_key=${data.apiKey} value=1 ${data.timestamp}`
}

async function reportMetric(request, response, startTime, endTime, env) {
  const compress = promisify(zlib.gzip);
  const reqData = getRequestData(request, response, startTime, endTime);
  const line = formatRequestData(reqData, env);
  console.log(line);

  // Define API endpoint and headers
  const url = `${env.INFLUX_URL}/api/v2/write?&bucket=${env.INFLUX_DATABASE}&precision=ms`;

  // Compress the string using gzip
  const compressedData = await compress(line);

  // Make the POST request
  return fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${env.INFLUX_TOKEN}`,
      'Content-Encoding': 'gzip',
      'Content-Type': 'text/plain; charset=utf-8',
    },
    body: compressedData,
  })
}

export default {
  async fetch(request, env, ctx) {
    const reqStartTime = Date.now();
    const response = await fetch('https://example.com');
    const reqEndTime = Date.now();
    ctx.waitUntil(reportMetric(request, response, reqStartTime, reqEndTime, env));
    return response;
  }
}