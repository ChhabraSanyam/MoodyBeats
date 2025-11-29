/**
 * Tests for BackendClient service
 * Requirements: 12.5, 13.1, 13.2, 17.1, 17.2, 17.3, 17.4, 17.5
 */

import { BackendClient } from '../BackendClient';

// Mock global fetch and XMLHttpRequest
global.fetch = jest.fn();
global.XMLHttpRequest = jest.fn(() => ({
  open: jest.fn(),
  send: jest.fn(),
  setRequestHeader: jest.fn(),
  upload: {
    addEventListener: jest.fn(),
  },
  addEventListener: jest.fn(),
  timeout: 0,
  status: 0,
  statusText: '',
  responseText: '',
})) as any;

describe('BackendClient', () => {
  let backendClient: BackendClient;

  beforeEach(() => {
    backendClient = new BackendClient();
    jest.clearAllMocks();
  });

  const createMockArchiveBlob = (): Blob => {
    return new Blob(['mock archive data'], { type: 'application/zip' });
  };

  describe('uploadArchive', () => {
    it('should upload archive and return valid response', async () => {
      // Requirements: 12.5, 13.1, 17.1
      const mockArchive = createMockArchiveBlob();
      const mockResponse = {
        id: 'test-id-123',
        url: 'https://share.moodybeats.sanyamchhabra.in/t/test-id-123',
      };

      // Mock XMLHttpRequest
      const mockXHR = {
        open: jest.fn(),
        send: jest.fn(),
        upload: {
          addEventListener: jest.fn(),
        },
        addEventListener: jest.fn((event: string, handler: Function) => {
          if (event === 'load') {
            // Simulate successful response
            setTimeout(() => {
              (mockXHR as any).status = 200;
              (mockXHR as any).responseText = JSON.stringify(mockResponse);
              handler();
            }, 0);
          }
        }),
        timeout: 0,
        status: 200,
        statusText: 'OK',
        responseText: JSON.stringify(mockResponse),
      };

      (global.XMLHttpRequest as any) = jest.fn(() => mockXHR);

      const response = await backendClient.uploadArchive(mockArchive);

      expect(response).toEqual(mockResponse);
      expect(response.id).toBe('test-id-123');
      expect(response.url).toBe('https://share.moodybeats.sanyamchhabra.in/t/test-id-123');
    });

    it('should track upload progress', async () => {
      // Requirements: 17.3
      const mockArchive = createMockArchiveBlob();
      const mockResponse = {
        id: 'test-id-123',
        url: 'https://share.moodybeats.sanyamchhabra.in/t/test-id-123',
      };

      const progressCallback = jest.fn();
      let uploadProgressHandler: Function | null = null;

      const mockXHR = {
        open: jest.fn(),
        send: jest.fn(),
        upload: {
          addEventListener: jest.fn((event: string, handler: Function) => {
            if (event === 'progress') {
              uploadProgressHandler = handler;
            }
          }),
        },
        addEventListener: jest.fn((event: string, handler: Function) => {
          if (event === 'load') {
            setTimeout(() => {
              // Simulate progress events
              if (uploadProgressHandler) {
                uploadProgressHandler({ lengthComputable: true, loaded: 50, total: 100 });
                uploadProgressHandler({ lengthComputable: true, loaded: 100, total: 100 });
              }

              (mockXHR as any).status = 200;
              (mockXHR as any).responseText = JSON.stringify(mockResponse);
              handler();
            }, 0);
          }
        }),
        timeout: 0,
        status: 200,
        statusText: 'OK',
        responseText: JSON.stringify(mockResponse),
      };

      (global.XMLHttpRequest as any) = jest.fn(() => mockXHR);

      await backendClient.uploadArchive(mockArchive, progressCallback);

      // Progress callback should have been called
      expect(mockXHR.upload.addEventListener).toHaveBeenCalledWith('progress', expect.any(Function));
    });

    it('should retry on network errors', async () => {
      // Requirements: 17.3
      const mockArchive = createMockArchiveBlob();
      const mockResponse = {
        id: 'test-id-123',
        url: 'https://share.moodybeats.sanyamchhabra.in/t/test-id-123',
      };

      let attemptCount = 0;

      const mockXHR = {
        open: jest.fn(),
        send: jest.fn(),
        upload: {
          addEventListener: jest.fn(),
        },
        addEventListener: jest.fn((event: string, handler: Function) => {
          if (event === 'load') {
            setTimeout(() => {
              attemptCount++;
              if (attemptCount < 2) {
                // Fail first attempt
                (mockXHR as any).status = 500;
                (mockXHR as any).statusText = 'Internal Server Error';
              } else {
                // Succeed on second attempt
                (mockXHR as any).status = 200;
                (mockXHR as any).responseText = JSON.stringify(mockResponse);
              }
              handler();
            }, 0);
          }
        }),
        timeout: 0,
        status: 500,
        statusText: 'Internal Server Error',
        responseText: '',
      };

      (global.XMLHttpRequest as any) = jest.fn(() => mockXHR);

      const response = await backendClient.uploadArchive(mockArchive);

      expect(response).toEqual(mockResponse);
      expect(attemptCount).toBe(2);
    });

    it('should throw error after max retries', async () => {
      // Requirements: 17.3
      const mockArchive = createMockArchiveBlob();

      const mockXHR = {
        open: jest.fn(),
        send: jest.fn(),
        upload: {
          addEventListener: jest.fn(),
        },
        addEventListener: jest.fn((event: string, handler: Function) => {
          if (event === 'load') {
            setTimeout(() => {
              (mockXHR as any).status = 500;
              (mockXHR as any).statusText = 'Internal Server Error';
              handler();
            }, 0);
          }
        }),
        timeout: 0,
        status: 500,
        statusText: 'Internal Server Error',
        responseText: '',
      };

      (global.XMLHttpRequest as any) = jest.fn(() => mockXHR);

      await expect(backendClient.uploadArchive(mockArchive)).rejects.toThrow(
        /Failed to upload archive after 3 attempts/
      );
    });
  });

  describe('downloadArchive', () => {
    it('should download archive from backend', async () => {
      // Requirements: 13.2, 17.2, 17.4
      const mockBlob = createMockArchiveBlob();
      const mockId = 'test-id-123';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        blob: jest.fn().mockResolvedValue(mockBlob),
      });

      const result = await backendClient.downloadArchive(mockId);

      expect(result).toBeInstanceOf(Blob);
      expect(global.fetch).toHaveBeenCalledWith(
        `https://share.moodybeats.sanyamchhabra.in/t/${mockId}`,
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Accept': 'application/zip, application/octet-stream',
          },
        })
      );
    });

    it('should throw error for 404 not found', async () => {
      // Requirements: 17.2
      const mockId = 'nonexistent-id';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(backendClient.downloadArchive(mockId)).rejects.toThrow(
        /Mixtape not found/
      );
    });

    it('should retry on network errors', async () => {
      // Requirements: 17.3
      const mockBlob = createMockArchiveBlob();
      const mockId = 'test-id-123';

      // Fail first attempt, succeed on second
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          blob: jest.fn().mockResolvedValue(mockBlob),
        });

      const result = await backendClient.downloadArchive(mockId);

      expect(result).toBeInstanceOf(Blob);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries', async () => {
      // Requirements: 17.3
      const mockId = 'test-id-123';

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(backendClient.downloadArchive(mockId)).rejects.toThrow(
        /Failed to download archive after 3 attempts/
      );
    });

    it('should throw error for empty blob after retries', async () => {
      // Requirements: 17.2, 17.3
      const mockId = 'test-id-123';
      const emptyBlob = new Blob([], { type: 'application/zip' });

      // Return empty blob for all attempts
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        blob: jest.fn().mockResolvedValue(emptyBlob),
      });

      await expect(backendClient.downloadArchive(mockId)).rejects.toThrow(
        /Failed to download archive after 3 attempts/
      );
    });
  });

  describe('isBackendReachable', () => {
    it('should return true when backend is reachable', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await backendClient.isBackendReachable();

      expect(result).toBe(true);
    });

    it('should return true for 404 response (server is up)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await backendClient.isBackendReachable();

      expect(result).toBe(true);
    });

    it('should return false when backend is unreachable', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await backendClient.isBackendReachable();

      expect(result).toBe(false);
    });
  });
});
