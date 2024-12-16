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
    global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const reportRequestMetrics = vi.fn()
    const response = await worker.fetch(request, env, ctx, { reportRequestMetrics });
    expect(global.fetch).toHaveBeenCalledWith(request);
    expect(reportRequestMetrics).toHaveBeenCalledWith(request, env);
    expect(ctx.waitUntil).toHaveBeenCalledWith(reportRequestMetrics(request, env));
    expect(response.status).toBe(200);
  });
});
