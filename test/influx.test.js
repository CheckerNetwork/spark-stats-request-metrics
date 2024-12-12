import { describe, it, expect, vi } from 'vitest';
import { reportRequestMetric } from '../lib/influx.js';

describe('reportRequestMetric', () => {
  it('should report metrics to InfluxDB over HTTP', async () => {
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

    const date = new Date();
    vi.useFakeTimers();
    vi.setSystemTime(date);

    global.fetch = vi.fn().mockResolvedValue({ status: 204 });

    await reportRequestMetric(request, env);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://influx.example.com/api/v2/write?&bucket=test_db&precision=ms',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Token test_token',
          'Content-Type': 'application/octet-stream'
        }),
        body: `test_metric api_key="test-key" ${date.valueOf()}`
      })
    );
  });
});
