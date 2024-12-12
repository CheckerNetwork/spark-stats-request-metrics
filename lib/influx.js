/* 
* Reports request metrics to InfluxDB
* @param {Request} request - incoming request
* @param {object} env - environment variables
*/
export const reportRequestMetric = async (request, env) => {
  await writeMetrics(createMetricsFromRequest(request, env), env)
}

/*
* Returns request metrics in InfluxDB line protocol format
* https://docs.influxdata.com/influxdb/cloud/reference/syntax/line-protocol/ 
* @param {Request} request - incoming request
* @param {object} env - environment variables
*/
export const createMetricsFromRequest = (request, env) => {
  const url = new URL(request.url);
  const timestamp = Date.now();
  const apiKey = request.headers.get('api-key') ||
    url.searchParams.get('api-key') || (
      request.headers.get('Authorization')?.startsWith('Bearer ')
        ? request.headers.get('Authorization').substring(7)
        : 'unknown'
    );

  return `${env.INFLUX_METRIC_NAME} api_key="${apiKey}" ${timestamp}`
}

/*
* Sends request metrics to InfluxDB
* https://docs.influxdata.com/enterprise_influxdb/v1/guides/write_data/
* @param {string} lineProtocolData - InfluxDB line protocol formatted data
* @param {object} env - environment variables
*/
export const writeMetrics = async (lineProtocolData, env) => {
  // Define API endpoint and headers
  const url = `${env.INFLUX_URL}/api/v2/write?&bucket=${env.INFLUX_DATABASE}&precision=ms`;

  return fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${env.INFLUX_TOKEN}`,
      'Content-Type': 'application/octet-stream'
    },
    body: lineProtocolData,
  })
}
