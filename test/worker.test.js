import { describe, it, expect, vi } from 'vitest';
import worker, { handleRequest } from '../bin/worker.js';
import { reportMetric } from '../lib/influx.js';

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

  describe('worker.fetch', () => {
    it('should fetch and report metrics correctly', async () => {
      const request = {
        url: 'https://example.com/path?api-key=test-key',
        method: 'GET'
      };
      const env = {
        REQUEST_URL: 'https://proxy.example.com'
      };
      const ctx = {
        waitUntil: vi.fn()
      };

      global.fetch = vi.fn().mockResolvedValue({ status: 200 });
      const response = await worker.fetch(request, env, ctx);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://proxy.example.com/path?api-key=test-key',
          method: 'GET'
        })
      );
      expect(ctx.waitUntil).toHaveBeenCalledWith(reportMetric(request, response, env));
      expect(response.status).toBe(200);
    });
  });
});