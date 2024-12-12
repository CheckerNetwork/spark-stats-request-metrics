import { describe, it, expect, vi } from 'vitest';
import { reportMetric, createMetricsFromRequest } from '../lib/influx.js';

describe('reportMetric', () => {
  it('should report metrics correctly', async () => {
    const request = {
      url: 'https://example.com/path?api-key=test-key',
      method: 'GET',
      headers: new Map([
        ['api-key', 'test-key'],
        ['Authorization', 'Bearer test-token']
      ])
    };

    const env = {
      INFLUX_METRIC_NAME: 'test_metric',
      INFLUX_URL: 'https://influx.example.com',
      INFLUX_DATABASE: 'test_db',
      INFLUX_TOKEN: 'test_token'
    };

    global.fetch = vi.fn().mockResolvedValue({ status: 204 });

    await reportMetric(request, env);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://influx.example.com/api/v2/write?&bucket=test_db&precision=ms',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Token test_token',
          'Content-Type': 'application/octet-stream'
        })
      })
    );
  });
});

describe('createMetricsFromRequest', () => {
  it('should format request data correctly', () => {
    const request = {
      url: 'https://example.com/path?api-key=test-key',
      method: 'GET',
      headers: new Map([
        ['api-key', 'test-key'],
        ['Authorization', 'Bearer test-token']
      ])
    };

    const env = {
      INFLUX_METRIC_NAME: 'test_metric'
    };

    const result = createMetricsFromRequest(request, env);
    expect(result).toContain('test_metric');
    expect(result).toContain('api_key="test-key"');
  });
});