import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMetricsFromRequest, writeMetrics, reportRequestMetric } from '../lib/influx.js'

describe('reportRequestMetric', () => {
  const date = new Date()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(date)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reports request metrics to InfluxDB over HTTP', async () => {
    const env = withTestEnvitronment()
    const request = {
      url: 'https://example.com/path',
      method: 'GET',
      headers: new Map([['api-key', 'test-key']]),
    }
    global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

    await reportRequestMetric(request, env);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://influx.example.com/api/v2/write?&bucket=test_db&precision=ms',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Token test_token',
          'Content-Type': 'application/octet-stream',
        }),
        body: `test_metric api_key="test-key" ${date.getTime()}`,
      }),
    )
  });
});

describe('createMetricsFromRequest', () => {
  const date = new Date()
  const env = withTestEnvitronment()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(date)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const testCases = [
    {
      description: 'when request has an API key in the Authorization header',
      request: {
        url: 'https://example.com/path',
        method: 'GET',
        headers: new Map([['Authorization', 'Bearer test-key']]),
      },
      expectedApiKey: 'test-key',
    },
    {
      description: 'when request has an API key in the api-key header',
      request: {
        url: 'https://example.com/path',
        method: 'GET',
        headers: new Map([['api-key', 'test-key']]),
      },
      expectedApiKey: 'test-key',
    },
    {
      description: 'when request has an API key in the query string',
      request: {
        url: 'https://example.com/path?api-key=test-key',
        method: 'GET',
        headers: new Map(),
      },
      expectedApiKey: 'test-key',
    },
    {
      description: 'when request has no API key',
      request: {
        url: 'https://example.com/path',
        method: 'GET',
        headers: new Map(),
      },
      expectedApiKey: 'unknown',
    },
  ]

  testCases.forEach(({ description, request, expectedApiKey }) => {
    it(description, () => {
      const result = createMetricsFromRequest(request, env)
      expect(result).toContain(expectedApiKey)
    })
  })
})

describe('writeMetrics', () => {
  it('send request metrics to InfluxDB over HTTP', async () => {
    const env = withTestEnvitronment()
    const lineProtocolData = 'test_metric api_key="test-key"'
    global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))

    const response = await writeMetrics(lineProtocolData, env)

    expect(global.fetch).toHaveBeenCalledWith(
      'https://influx.example.com/api/v2/write?&bucket=test_db&precision=ms',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Token test_token',
          'Content-Type': 'application/octet-stream',
        }),
        body: lineProtocolData,
      }),
    )
    expect(response.status).toBe(204)
  })
})

const withTestEnvitronment = () => {
  return {
    INFLUX_METRIC_NAME: 'test_metric',
    INFLUX_URL: 'https://influx.example.com',
    INFLUX_DATABASE: 'test_db',
    INFLUX_TOKEN: 'test_token',
  }
}
