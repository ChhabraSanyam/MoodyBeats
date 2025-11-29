/**
 * Storage batching utility for optimized batch operations
 * Performance optimization for task 24
 */

type BatchOperation<T> = {
  id: string;
  operation: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
};

/**
 * BatchProcessor handles batching of async operations
 * to reduce overhead and improve performance
 */
export class BatchProcessor<T> {
  private queue: BatchOperation<T>[] = [];
  private processing: boolean = false;
  private batchSize: number;
  private batchDelay: number;
  private timeout: ReturnType<typeof setTimeout> | null = null;

  constructor(batchSize: number = 10, batchDelay: number = 50) {
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
  }

  /**
   * Add an operation to the batch queue
   */
  async add(id: string, operation: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ id, operation, resolve, reject });

      // Clear existing timeout
      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      // Process immediately if batch is full
      if (this.queue.length >= this.batchSize) {
        this.processBatch();
      } else {
        // Otherwise, wait for more operations or timeout
        this.timeout = setTimeout(() => {
          this.processBatch();
        }, this.batchDelay);
      }
    });
  }

  /**
   * Process the current batch of operations
   */
  private async processBatch(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    // Take operations from queue
    const batch = this.queue.splice(0, this.batchSize);

    // Execute all operations in parallel
    const results = await Promise.allSettled(
      batch.map(item => item.operation())
    );

    // Resolve or reject each promise
    results.forEach((result, index) => {
      const item = batch[index];
      if (result.status === 'fulfilled') {
        item.resolve(result.value);
      } else {
        item.reject(result.reason);
      }
    });

    this.processing = false;

    // Process remaining items if any
    if (this.queue.length > 0) {
      this.processBatch();
    }
  }

  /**
   * Flush all pending operations immediately
   */
  async flush(): Promise<void> {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    await this.processBatch();
  }

  /**
   * Clear all pending operations
   */
  clear(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    // Reject all pending operations
    this.queue.forEach(item => {
      item.reject(new Error('Batch processor cleared'));
    });
    this.queue = [];
  }
}

/**
 * Create a batched version of a repository method
 */
export function createBatchedMethod<T, R>(
  method: (arg: T) => Promise<R>,
  batchSize: number = 10,
  batchDelay: number = 50
): (arg: T) => Promise<R> {
  const processor = new BatchProcessor<R>(batchSize, batchDelay);

  return (arg: T) => {
    const id = JSON.stringify(arg);
    return processor.add(id, () => method(arg));
  };
}

/**
 * Debounce utility for reducing frequent operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle utility for limiting operation frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
