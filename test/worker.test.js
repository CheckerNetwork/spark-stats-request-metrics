import { describe, it, expect, vi } from 'vitest';
import { handleRequest } from '../bin/worker.js';

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