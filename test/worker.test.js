import worker from '../bin/worker.js';
import { describe, it, expect, vi } from 'vitest';

describe('worker.fetch', () => {
  it('should fetch and report metrics', async () => {
    const request = {
      url: 'https://example.com/path',
      method: 'GET'
    };
    const env = {};
    const ctx = {
      waitUntil: vi.fn()
    };
    global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const reportRequestMetric = vi.fn()
    const response = await worker.fetch(request, env, ctx, { reportRequestMetric });
    expect(global.fetch).toHaveBeenCalledWith(request);
    expect(ctx.waitUntil).toHaveBeenCalledWith(reportRequestMetric(request, env));
    expect(reportRequestMetric).toHaveBeenCalledWith(request, env);
    expect(response.status).toBe(204);
  });
});
