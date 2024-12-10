import { describe, it, expect } from 'vitest';
import { formatRequestData } from '../lib/request.js';

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