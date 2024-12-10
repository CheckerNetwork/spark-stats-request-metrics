export const formatRequestData = (request, response, env) => {
  const url = new URL(request.url);
  const timestamp = Date.now();
  const originResponse = response || {};
  const apiKey = request.headers.get('api-key') || url.searchParams.get('api-key') || (request.headers.get('Authorization')?.startsWith('Bearer ') ? request.headers.get('Authorization').substring(7) : 'unknown');
  const cfCache = (originResponse) ? (response.headers.get('CF-Cache-Status') || 'miss') : 'miss'
  const formattedUrl = url.toString().replaceAll('=', '\\=');

  // We're setting field value to 1 to count the number of requests
  return `${env.INFLUX_METRIC},status_code=${originResponse.status},url=${formattedUrl},hostname=${url.hostname},pathname="${url.pathname}",method=${request.method},cf_cache=${cfCache},api_key=${apiKey} value=1 ${timestamp}`
}

export const handleRequest = async (request, env) => {
  const url = new URL(request.url);
  const newRequest = new Request(`${env.REQUEST_URL}${url.pathname}${url.search}`, request);

  return await fetch(newRequest);
}