import type { FileChangeEvent } from './types';
import { Events } from '../Events';
import { loggers } from '../utils/logger';

/**
 * Priority levels for upload queue items
 */
export type UploadPriority = 'critical' | 'high' | 'normal';

/**
 * Queued item with priority and retry info
 */
interface QueuedItem {
  id: string;
  event: FileChangeEvent;
  priority: UploadPriority;
  attempts: number;
  nextRetry: Date;
  lastError?: string;
  createdAt: Date;
}

/**
 * Serializable queue item for persistence
 */
interface SerializedQueueItem {
  id: string;
  event: FileChangeEvent;
  priority: UploadPriority;
  attempts: number;
  nextRetry: string;
  lastError?: string;
  createdAt: string;
}

/**
 * UploadQueue - Manages upload retry logic with prioritization and persistence
 * 
 * Features:
 * - Priority-based processing (critical > high > normal)
 * - localStorage persistence for crash recovery
 * - Exponential backoff for retries
 * - Deduplication by path
 * - Pausable processing
 * 
 * Events:
 * - 'queue-change': Queue size changed
 * - 'upload': Item ready for upload
 * - 'upload-success': Upload completed
 * - 'upload-retry': Upload being retried
 * - 'upload-permanent-failure': Max retries exceeded
 */
export class UploadQueue extends Events {
  private queue: QueuedItem[] = [];
  private logger = loggers.sync || loggers.app;
  private processTimer: NodeJS.Timeout | null = null;
  private isPaused = false;
  private idCounter = 0;

  // Configuration
  private readonly MAX_RETRIES = 5;
  private readonly BASE_DELAY_MS = 1000;
  private readonly PROCESS_INTERVAL_MS = 2000;
  private readonly STORAGE_KEY = 'inkdown-upload-queue';

  constructor() {
    super();
    // Restore persisted queue on construction
    this.loadFromStorage();
  }

  /**
   * Add item to upload queue with priority
   */
  enqueue(event: FileChangeEvent, priority: UploadPriority = 'normal'): void {
    // Check if item already exists in queue (by path)
    const existingIndex = this.queue.findIndex(item => item.event.path === event.path);

    if (existingIndex !== -1) {
      const existing = this.queue[existingIndex];
      // Update existing item with latest event
      existing.event = event;
      existing.nextRetry = new Date(); // Reset retry time
      // Upgrade priority if higher
      if (this.priorityValue(priority) > this.priorityValue(existing.priority)) {
        existing.priority = priority;
      }
      this.logger.debug(`Updated queued item: ${event.path} (priority: ${existing.priority})`);
    } else {
      // Add new item
      this.queue.push({
        id: `upload-${++this.idCounter}-${Date.now()}`,
        event,
        priority,
        attempts: 0,
        nextRetry: new Date(),
        createdAt: new Date(),
      });
      this.logger.debug(`Enqueued new item: ${event.path} (priority: ${priority})`);
    }

    // Sort by priority
    this.sortQueue();

    // Persist changes
    this.saveToStorage();

    this.trigger('queue-change', this.queue.length);

    // Start processing if not already running
    if (!this.processTimer && !this.isPaused) {
      this.startProcessing();
    }
  }

  /**
   * Enqueue with high priority (for user-initiated syncs)
   */
  enqueueHigh(event: FileChangeEvent): void {
    this.enqueue(event, 'high');
  }

  /**
   * Enqueue with critical priority (for conflict resolution)
   */
  enqueueCritical(event: FileChangeEvent): void {
    this.enqueue(event, 'critical');
  }

  /**
   * Remove item from queue by path
   */
  remove(path: string): void {
    const initialSize = this.queue.length;
    this.queue = this.queue.filter(item => item.event.path !== path);

    if (this.queue.length < initialSize) {
      this.logger.debug(`Removed item from queue: ${path}`);
      this.saveToStorage();
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
    this.clearStorage();
    this.trigger('queue-change', 0);
    this.logger.debug('Queue cleared');
  }

  /**
   * Pause queue processing (items remain queued)
   */
  pause(): void {
    this.isPaused = true;
    this.stopProcessing();
    this.logger.debug('Queue paused');
  }

  /**
   * Resume queue processing
   */
  resume(): void {
    this.isPaused = false;
    if (this.queue.length > 0) {
      this.startProcessing();
    }
    this.logger.debug('Queue resumed');
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
   * Get queue items with details
   */
  getItems(): Readonly<QueuedItem>[] {
    return [...this.queue];
  }

  /**
   * Check if processing is paused
   */
  get paused(): boolean {
    return this.isPaused;
  }

  /**
   * Start periodic processing of queue
   */
  private startProcessing(): void {
    if (this.processTimer || this.isPaused) return;

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
    if (this.isPaused) return;

    const now = new Date();
    const readyItems = this.queue.filter(item => item.nextRetry <= now);

    this.logger.debug(`processQueue: ${readyItems.length} items ready, ${this.queue.length} total in queue`);

    if (readyItems.length === 0) {
      return;
    }

    this.logger.info(`Processing ${readyItems.length} items from queue`);

    for (const item of readyItems) {
      if (this.isPaused) break;

      try {
        this.logger.debug(`Triggering upload for: ${item.event.path} (priority: ${item.priority})`);
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
    item.lastError = error.message;

    if (item.attempts >= this.MAX_RETRIES) {
      // Max retries reached - notify user and remove from queue
      this.logger.error(
        `Upload failed permanently after ${this.MAX_RETRIES} attempts: ${path}`,
        error
      );
      this.trigger('upload-permanent-failure', {
        path,
        error: error.message,
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

      this.saveToStorage();

      this.trigger('upload-retry', {
        path,
        error: error.message,
        attempts: item.attempts,
        nextRetry: item.nextRetry,
      });
    }
  }

  /**
   * Sort queue by priority (highest first)
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // Priority first
      const priorityDiff = this.priorityValue(b.priority) - this.priorityValue(a.priority);
      if (priorityDiff !== 0) return priorityDiff;
      // Then by creation time (oldest first)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  /**
   * Convert priority to numeric value for sorting
   */
  private priorityValue(priority: UploadPriority): number {
    switch (priority) {
      case 'critical': return 3;
      case 'high': return 2;
      case 'normal': return 1;
      default: return 0;
    }
  }

  /**
   * Save queue to localStorage for crash recovery
   */
  private saveToStorage(): void {
    try {
      const serialized: SerializedQueueItem[] = this.queue.map(item => ({
        id: item.id,
        event: item.event,
        priority: item.priority,
        attempts: item.attempts,
        nextRetry: item.nextRetry.toISOString(),
        lastError: item.lastError,
        createdAt: item.createdAt.toISOString(),
      }));
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serialized));
    } catch (error) {
      this.logger.warn('Failed to persist queue to storage:', error);
    }
  }

  /**
   * Load queue from localStorage
   * Note: Does NOT emit queue-change to avoid UI updates before sync engine is ready
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const serialized: SerializedQueueItem[] = JSON.parse(stored);
      this.queue = serialized.map(item => ({
        id: item.id,
        event: item.event,
        priority: item.priority,
        attempts: item.attempts,
        nextRetry: new Date(item.nextRetry),
        lastError: item.lastError,
        createdAt: new Date(item.createdAt),
      }));

      if (this.queue.length > 0) {
        this.logger.info(`Restored ${this.queue.length} items from storage`);
        // NOTE: Don't emit queue-change here - sync engine will handle it after initialization
        // Emitting here causes UI to show pending items before sync engine is ready
      }
    } catch (error) {
      this.logger.warn('Failed to load queue from storage:', error);
      this.clearStorage();
    }
  }

  /**
   * Clear persisted queue storage
   * Should be called after successful sync to prevent stale items on next startup
   */
  clearStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this.logger.debug('Cleared storage');
    } catch {
      // Ignore storage errors
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

