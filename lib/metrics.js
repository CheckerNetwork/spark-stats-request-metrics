import zlib from 'node:zlib';
import { promisify } from 'node:util';
import { formatRequestData } from './request.js';

export const reportMetric = async (request, response, env) => {
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
    body: await compress(formatRequestData(request, response, env)),
  })
}