/**
 * BackendClient service for uploading and downloading mixtape archives
 * Requirements: 12.5, 13.1, 13.2, 17.1, 17.2, 17.3, 17.4, 17.5
 */

/**
 * Response from backend upload endpoint
 */
export interface UploadResponse {
  id: string;
  url: string;
}

/**
 * Upload progress callback
 */
export type UploadProgressCallback = (progress: number) => void;

/**
 * BackendClient handles communication with the MoodyBeats backend API
 * for uploading and downloading mixtape archives
 */
export class BackendClient {
  private static readonly BASE_URL = 'https://share.moodybeats.sanyamchhabra.in';
  private static readonly UPLOAD_ENDPOINT = '/upload';
  private static readonly DOWNLOAD_ENDPOINT = '/t';
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY_MS = 1000;
  private static readonly REQUEST_TIMEOUT_MS = 30000; // 30 seconds

  /**
   * Upload a mixtape archive to the backend
   * Requirements: 12.5, 13.1, 17.1, 17.3
   * 
   * @param archive - The archive blob to upload
   * @param onProgress - Optional callback for upload progress (0-100)
   * @returns Promise resolving to upload response with id and url
   * @throws Error if upload fails after retries
   */
  async uploadArchive(
    archive: Blob | any,
    onProgress?: UploadProgressCallback
  ): Promise<UploadResponse> {
    let lastError: Error | null = null;

    // Retry logic with exponential backoff
    for (let attempt = 0; attempt < BackendClient.MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          // Wait before retrying (exponential backoff)
          const delay = BackendClient.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          await this.delay(delay);
        }

        const response = await this.uploadWithProgress(archive, onProgress);
        return response;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (__DEV__) {
          console.warn(`Upload attempt ${attempt + 1} failed:`, lastError.message);
        }
        
        // Don't retry on client errors (4xx)
        if (err instanceof Error && err.message.includes('4')) {
          throw err;
        }
      }
    }

    // All retries failed
    throw new Error(
      `Failed to upload archive after ${BackendClient.MAX_RETRIES} attempts: ${lastError?.message}`
    );
  }

  /**
   * Perform the actual upload with progress tracking
   * Requirements: 17.1, 17.3
   */
  private async uploadWithProgress(
    archive: Blob | any,
    onProgress?: UploadProgressCallback
  ): Promise<UploadResponse> {
    const url = `${BackendClient.BASE_URL}${BackendClient.UPLOAD_ENDPOINT}`;

    // Create FormData for file upload
    const formData = new FormData();
    
    // Handle both Blob (web) and file URI object (React Native)
    if (archive.uri) {
      // React Native file object with URI
      formData.append('archive', archive as any);
    } else {
      // Web Blob
      formData.append('archive', archive, 'mixtape.mixblues');
    }

    // Create XMLHttpRequest for progress tracking
    return new Promise<UploadResponse>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Set timeout
      xhr.timeout = BackendClient.REQUEST_TIMEOUT_MS;

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });
      }

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText) as UploadResponse;
            
            // Validate response structure
            if (!this.isValidUploadResponse(response)) {
              reject(new Error('Invalid response format from server'));
              return;
            }

            resolve(response);
          } catch {
            reject(new Error('Failed to parse server response'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload request timed out'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was aborted'));
      });

      // Send request
      xhr.open('POST', url);
      xhr.send(formData);
    });
  }

  /**
   * Download a mixtape archive from the backend
   * Requirements: 13.2, 17.2, 17.4
   * 
   * @param id - The unique identifier of the mixtape
   * @returns Promise resolving to the archive blob
   * @throws Error if download fails after retries
   */
  async downloadArchive(id: string): Promise<Blob> {
    let lastError: Error | null = null;

    // Retry logic with exponential backoff
    for (let attempt = 0; attempt < BackendClient.MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          // Wait before retrying (exponential backoff)
          const delay = BackendClient.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          await this.delay(delay);
        }

        const blob = await this.performDownload(id);
        return blob;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (__DEV__) {
          console.warn(`Download attempt ${attempt + 1} failed:`, lastError.message);
        }
        
        // Don't retry on client errors (4xx)
        if (err instanceof Error && err.message.includes('404')) {
          throw new Error(`Mixtape not found: ${id}`);
        }
      }
    }

    // All retries failed
    throw new Error(
      `Failed to download archive after ${BackendClient.MAX_RETRIES} attempts: ${lastError?.message}`
    );
  }

  /**
   * Perform the actual download
   * Requirements: 17.2, 17.4
   */
  private async performDownload(id: string): Promise<Blob> {
    const url = `${BackendClient.BASE_URL}${BackendClient.DOWNLOAD_ENDPOINT}/${id}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BackendClient.REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/zip, application/octet-stream',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('404: Mixtape not found');
        }
        throw new Error(`Download failed with status ${response.status}: ${response.statusText}`);
      }

      // Get the blob from response
      const blob = await response.blob();

      // Validate that we got a valid blob
      if (!blob || blob.size === 0) {
        throw new Error('Downloaded archive is empty');
      }

      return blob;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Download request timed out');
        }
        throw error;
      }
      
      throw new Error('Network error during download');
    }
  }

  /**
   * Validate upload response structure
   * Requirements: 13.1, 17.1
   */
  private isValidUploadResponse(response: any): response is UploadResponse {
    if (!response || typeof response !== 'object') {
      return false;
    }

    // Check for required fields
    if (!response.id || typeof response.id !== 'string') {
      return false;
    }

    if (!response.url || typeof response.url !== 'string') {
      return false;
    }

    // Validate URL format
    const expectedUrlPattern = `${BackendClient.BASE_URL}${BackendClient.DOWNLOAD_ENDPOINT}/${response.id}`;
    if (response.url !== expectedUrlPattern) {
      return false;
    }

    return true;
  }

  /**
   * Helper to create a delay promise
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if the backend is reachable
   * Useful for offline detection
   * 
   * @returns Promise resolving to true if backend is reachable
   */
  async isBackendReachable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(BackendClient.BASE_URL, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok || response.status === 404; // 404 is fine, means server is up
    } catch {
      return false;
    }
  }
}
