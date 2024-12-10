import { describe, it, expect, vi } from 'vitest';
import { formatRequestData, handleRequest } from '../lib/request.js';

describe('formatRequestData', () => {
  it('should format request data correctly', () => {
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
      INFLUX_METRIC: 'test_metric'
    };

    const result = formatRequestData(request, response, env);
    expect(result).toContain('test_metric');
    expect(result).toContain('status_code=200');
    expect(result).toContain('url=https://example.com/path?api-key\\=test-key');
    expect(result).toContain('hostname=example.com');
    expect(result).toContain('pathname="/path"');
    expect(result).toContain('method=GET');
    expect(result).toContain('cf_cache=HIT');
    expect(result).toContain('api_key=test-key');
  });
});



describe('handleRequest', () => {
  it('should handle request correctly', async () => {
    const request = {
      url: 'https://example.com/path?api-key=test-key',
      method: 'GET'
    };
    const env = {
      REQUEST_URL: 'https://proxy.example.com'
    };

    global.fetch = vi.fn().mockResolvedValue({ status: 200 });

    const response = await handleRequest(request, env);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://proxy.example.com/path?api-key=test-key',
        method: 'GET'
      })
    );
    expect(response.status).toBe(200);
  });
});