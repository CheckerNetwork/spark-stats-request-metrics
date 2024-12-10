import zlib from 'node:zlib';
import { promisify } from 'node:util';

function formatRequestData(request, response, env) {
  const url = new URL(request.url);
  const timestamp = Date.now();
  const originResponse = response || {};
  const apiKey = request.headers.get('api-key') || url.searchParams.get('api-key') || (request.headers.get('Authorization')?.startsWith('Bearer ') ? request.headers.get('Authorization').substring(7) : 'unknown');
  const cfCache = (originResponse) ? (response.headers.get('CF-Cache-Status') || 'miss') : 'miss'
  const formattedUrl = url.toString().replaceAll('=', '\\=');

  // We're setting field value to 1 to count the number of requests
  return `${env.INFLUX_METRIC},status_code=${originResponse.status},url=${formattedUrl},hostname=${url.hostname},pathname="${url.pathname}",method=${request.method},cf_cache=${cfCache},api_key=${apiKey} value=1 ${timestamp}`
}

async function reportMetric(request, response, env) {
  const compress = promisify(zlib.gzip);
  const requestData = formatRequestData(request, response, env);

  // Define API endpoint and headers
  const url = `${env.INFLUX_URL}/api/v2/write?&bucket=${env.INFLUX_DATABASE}&precision=ms`;

  // Compress the string using gzip
  const compressedData = await compress(requestData);

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


async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);
  const newRequest = new Request(`${env.REQUEST_URL}${url.pathname}${url.search}`, request);

  return await fetch(newRequest);
}

export default {
  async fetch(request, env, ctx) {
    let response;
    const cache = caches.default;

    if (request.method === 'GET') {
      response = await cache.match(request);
      if (!response) {
        response = await handleRequest(request, env, ctx);
        ctx.waitUntil(cache.put(request, response.clone()));
      }

    } else {
      response = await handleRequest(request, env, ctx);
    }

    // report metrics for original request
    ctx.waitUntil(reportMetric(request, response, env));
    return response;
  }
}