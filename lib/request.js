export const formatRequestData = (request, response = {}, env) => {
  const url = new URL(request.url);
  const timestamp = Date.now();
  const apiKey = request.headers.get('api-key') || url.searchParams.get('api-key') || (request.headers.get('Authorization')?.startsWith('Bearer ') ? request.headers.get('Authorization').substring(7) : 'unknown');
  const cfCache = response?.headers.get('CF-Cache-Status') ?? 'miss'
  const formattedUrl = url.toString().replaceAll('=', '\\=');

  // We're setting field value to 1 to count the number of requests
  return `${env.INFLUX_METRIC},status_code=${originResponse.status},url=${formattedUrl},hostname=${url.hostname},pathname="${url.pathname}",method=${request.method},cf_cache=${cfCache},api_key=${apiKey} value=1 ${timestamp}`
}