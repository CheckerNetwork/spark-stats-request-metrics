/*
* Sends request metrics to InfluxDB
* https://docs.influxdata.com/enterprise_influxdb/v1/guides/write_data/
*/
export const reportMetric = async (request, env) => {
  // Define API endpoint and headers
  const url = `${env.INFLUX_URL}/api/v2/write?&bucket=${env.INFLUX_DATABASE}&precision=ms`;

  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${env.INFLUX_TOKEN}`,
      'Content-Type': 'application/octet-stream'
    },
    body: createMetricsFromRequest(request, env),
  })
}

/*
* Returns request metrics in InfluxDB line protocol format
* https://docs.influxdata.com/influxdb/cloud/reference/syntax/line-protocol/ 
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

  // We're setting field value to 1 to count the number of requests
  return `${env.INFLUX_METRIC_NAME},api_key="${apiKey}" value=1 ${timestamp}`
}