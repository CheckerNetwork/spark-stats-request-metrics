import { describe, it, expect, vi } from 'vitest';
import { reportMetric } from '../lib/metrics.js';

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
    const response = {
      status: 200,
      headers: new Map([
        ['CF-Cache-Status', 'HIT']
      ])
    };
    const env = {
      INFLUX_METRIC: 'test_metric',
      INFLUX_URL: 'https://influx.example.com',
      INFLUX_DATABASE: 'test_db',
      INFLUX_TOKEN: 'test_token'
    };

    global.fetch = vi.fn().mockResolvedValue({ status: 204 });

    await reportMetric(request, response, env);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://influx.example.com/api/v2/write?&bucket=test_db&precision=ms',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Token test_token',
          'Content-Encoding': 'gzip',
          'Content-Type': 'text/plain; charset=utf-8'
        })
      })
    );
  });
});