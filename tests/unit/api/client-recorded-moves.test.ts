import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { ReachyMiniApiClient } from '../../../src/api/client.js';

const originalFetch = globalThis.fetch;
const mockFetch = vi.fn();

describe('ReachyMiniApiClient recorded moves path handling', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    globalThis.fetch = mockFetch as typeof fetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  test('listRecordedMoves preserves dataset path separators', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    });

    const client = new ReachyMiniApiClient({ baseUrl: 'http://localhost:8000/api' });
    await client.listRecordedMoves('pollen-robotics/reachy-mini-dances-library');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/move/recorded-move-datasets/list/pollen-robotics/reachy-mini-dances-library',
      expect.objectContaining({ method: 'GET' })
    );
  });

  test('playRecordedMove encodes dataset path correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ uuid: '1234' }),
    });

    const client = new ReachyMiniApiClient({ baseUrl: 'http://localhost:8000/api' });
    await client.playRecordedMove('pollen-robotics/reachy-mini-emotions-library', 'joy');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/move/play/recorded-move-dataset/pollen-robotics/reachy-mini-emotions-library/joy',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
