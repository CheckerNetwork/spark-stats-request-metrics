import zlib from 'node:zlib';
import { promisify } from 'node:util';

function getRequestData(request, response) {
  const timestamp = Date.now();
  const originResponse = response || {};
  const url = new URL(request.url);
  const apiKey = request.headers.get('api-key') || url.searchParams.get('api-key') || (request.headers.get('Authorization')?.startsWith('Bearer ') ? request.headers.get('Authorization').substring(7) : 'unknown');

  return {
    'timestamp': timestamp,
    'url': request.url,
    'method': request.method,
    'status': originResponse.status,
    'cfCache': (originResponse) ? (response.headers.get('CF-Cache-Status') || 'miss') : 'miss',
    'apiKey': apiKey,
  };
}

function formatRequestData(data, env) {
  const url = new URL(data.url);
  const formattedUrl = url.toString().replaceAll('=', '\\=');
  // We're setting field value to 1 to count the number of requests
  return `${env.INFLUX_METRIC},status_code=${data.status},url=${formattedUrl},hostname=${url.hostname},pathname="${url.pathname}",method=${data.method},cf_cache=${data.cfCache},api_key=${data.apiKey} value=1 ${data.timestamp}`
}

async function reportMetric(request, response, env) {
  const compress = promisify(zlib.gzip);
  const reqData = getRequestData(request, response);
  const line = formatRequestData(reqData, env);

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


async function handleRequest(request, env, ctx) {
  const cache = caches.default;
  const url = new URL(request.url);
  const newRequest = new Request(`${env.REQUEST_URL}${url.pathname}${url.search}`, request);
  const response = await fetch(newRequest);

  ctx.waitUntil(cache.put(request, response.clone()));
  return response;
}

export default {
  async fetch(request, env, ctx) {
    let response;
    const cache = caches.default;

    if (request.method === 'GET') {
      response = await cache.match(request);
      if (!response) {
        response = await handleRequest(request, env, ctx);
      }

    } else {
      response = await handleRequest(request, env, ctx);
    }

    // report metrics for original request
    ctx.waitUntil(reportMetric(request, response, env));
    return response;
  }
}