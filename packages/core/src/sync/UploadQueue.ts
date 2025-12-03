import type { FileChangeEvent } from './types';
import { Events } from '../Events';
import { loggers } from '../utils/logger';

interface QueuedItem {
  event: FileChangeEvent;
  attempts: number;
  nextRetry: Date;
  lastError?: Error;
}

/**
 * UploadQueue - Manages upload retry logic with exponential backoff
 */
export class UploadQueue extends Events {
  private queue: QueuedItem[] = [];
  private logger = loggers.sync || loggers.app;
  private processTimer: NodeJS.Timeout | null = null;
  private readonly MAX_RETRIES = 5;
  private readonly BASE_DELAY_MS = 1000;
  private readonly PROCESS_INTERVAL_MS = 2000;

  constructor() {
    super();
  }

  /**
   * Add item to upload queue
   */
  enqueue(event: FileChangeEvent): void {
    // Check if item already exists in queue (by path)
    const existing = this.queue.find(item => item.event.path === event.path);

    if (existing) {
      // Update existing item with latest event
      existing.event = event;
      existing.nextRetry = new Date(); // Reset retry time
      this.logger.debug(`Updated queued item: ${event.path}`);
    } else {
      // Add new item
      this.queue.push({
        event,
        attempts: 0,
        nextRetry: new Date(),
      });
      this.logger.debug(`Enqueued new item: ${event.path}`);
    }

    this.trigger('queue-change', this.queue.length);

    // Start processing if not already running
    if (!this.processTimer) {
      this.startProcessing();
    }
  }

  /**
   * Remove item from queue by path
   */
  remove(path: string): void {
    const initialSize = this.queue.length;
    this.queue = this.queue.filter(item => item.event.path !== path);

    if (this.queue.length < initialSize) {
      this.logger.debug(`Removed item from queue: ${path}`);
      this.trigger('queue-change', this.queue.length);
    }

    // Stop processing if queue is empty
    if (this.queue.length === 0) {
      this.stopProcessing();
    }
  }

  /**
   * Clear all items from queue
   */
  clear(): void {
    this.queue = [];
    this.stopProcessing();
    this.trigger('queue-change', 0);
    this.logger.debug('Queue cleared');
  }

  /**
   * Get current queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Get all pending items (copy)
   */
  getPending(): FileChangeEvent[] {
    return this.queue.map(item => item.event);
  }

  /**
   * Start periodic processing of queue
   */
  private startProcessing(): void {
    if (this.processTimer) return;

    this.logger.debug('Starting queue processor');
    this.processTimer = setInterval(() => {
      this.processQueue();
    }, this.PROCESS_INTERVAL_MS);

    // Process immediately as well
    this.processQueue();
  }

  /**
   * Stop periodic processing
   */
  private stopProcessing(): void {
    if (this.processTimer) {
      clearInterval(this.processTimer);
      this.processTimer = null;
      this.logger.debug('Stopped queue processor');
    }
  }

  /**
   * Process items in queue that are ready for retry
   */
  private async processQueue(): Promise<void> {
    const now = new Date();
    const readyItems = this.queue.filter(item => item.nextRetry <= now);

    this.logger.debug(`processQueue: ${readyItems.length} items ready, ${this.queue.length} total in queue`);

    if (readyItems.length === 0) {
      return;
    }

    this.logger.info(`Processing ${readyItems.length} items from queue`);

    for (const item of readyItems) {
      try {
        this.logger.debug(`Triggering upload for: ${item.event.path}`);
        // Emit event for upload
        this.trigger('upload', item.event);

        // Wait for upload result (will be set via markSuccess/markFailure)
        // For now, we assume the caller will handle this
      } catch (error) {
        this.logger.error(`Unexpected error processing queue item: ${item.event.path}`, error);
        this.markFailure(item.event.path, error as Error);
      }
    }
  }

  /**
   * Mark an upload as successful
   */
  markSuccess(path: string): void {
    const item = this.queue.find(i => i.event.path === path);
    if (item) {
      this.logger.info(`Upload successful: ${path} (${item.attempts + 1} attempts)`);
      this.remove(path);
      this.trigger('upload-success', path);
    }
  }

  /**
   * Mark an upload as failed and schedule retry
   */
  markFailure(path: string, error: Error): void {
    const item = this.queue.find(i => i.event.path === path);
    if (!item) return;

    item.attempts++;
    item.lastError = error;

    if (item.attempts >= this.MAX_RETRIES) {
      // Max retries reached - notify user and remove from queue
      this.logger.error(
        `Upload failed permanently after ${this.MAX_RETRIES} attempts: ${path}`,
        error
      );
      this.trigger('upload-permanent-failure', {
        path,
        error,
        attempts: item.attempts,
      });
      this.remove(path);
    } else {
      // Schedule retry with exponential backoff
      const delay = Math.pow(2, item.attempts) * this.BASE_DELAY_MS;
      item.nextRetry = new Date(Date.now() + delay);

      this.logger.warn(
        `Upload failed: ${path} (attempt ${item.attempts}/${this.MAX_RETRIES}), ` +
        `retrying in ${delay}ms`,
        error
      );

      this.trigger('upload-retry', {
        path,
        error,
        attempts: item.attempts,
        nextRetry: item.nextRetry,
      });
    }
  }

  /**
   * Stop queue and cleanup
   */
  destroy(): void {
    this.stopProcessing();
    this.clear();
    this.offAll();
  }
}
