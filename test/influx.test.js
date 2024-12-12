import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportRequestMetric } from '../lib/influx.js';

describe('reportRequestMetric', () => {
  const date = new Date();
  const env = {
    INFLUX_METRIC_NAME: 'test_metric',
    INFLUX_URL: 'https://influx.example.com',
    INFLUX_DATABASE: 'test_db',
    INFLUX_TOKEN: 'test_token'
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(date);
    global.fetch = vi.fn().mockResolvedValue({ status: 204 });
  });

  const testCases = [
    {
      description: 'when request has an API key in the Authorization header',
      request: {
        url: 'https://example.com/path',
        method: 'GET',
        headers: new Map([['Authorization', 'Bearer test-key']])
      },
      expectedApiKey: 'test-key'
    },
    {
      description: 'when request has an API key in the api-key header',
      request: {
        url: 'https://example.com/path',
        method: 'GET',
        headers: new Map([['api-key', 'test-key']])
      },
      expectedApiKey: 'test-key'
    },
    {
      description: 'when request has an API key in the query string',
      request: {
        url: 'https://example.com/path?api-key=test-key',
        method: 'GET',
        headers: new Map()
      },
      expectedApiKey: 'test-key'
    },
    {
      description: 'when request has no API key',
      request: {
        url: 'https://example.com/path',
        method: 'GET',
        headers: new Map()
      },
      expectedApiKey: 'unknown'
    }
  ];

  testCases.forEach(({ description, request, expectedApiKey }) => {
    it(description, async () => {
      await reportRequestMetric(request, env);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://influx.example.com/api/v2/write?&bucket=test_db&precision=ms',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Token test_token',
            'Content-Type': 'application/octet-stream'
          }),
          body: `test_metric api_key="${expectedApiKey}" ${date.valueOf()}`
        })
      );
    });
  });
});
