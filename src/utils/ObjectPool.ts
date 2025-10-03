/**
 * Generic object pool implementation for recycling objects to reduce garbage collection.
 *
 * @template T - The type of objects managed by this pool
 */
export class ObjectPool<T> {
  private readonly createFn: () => T;
  private readonly resetFn?: (obj: T) => void;
  private readonly pool: T[] = [];
  private readonly maxSize: number;
  private acquiredCount: number = 0;
  private releasedCount: number = 0;

  /**
   * Creates a new ObjectPool.
   *
   * @param createFn - Function that creates new instances of T
   * @param resetFn - Optional function to reset objects when returning to pool
   * @param initialSize - Initial number of objects to pre-allocate
   * @param maxSize - Maximum size of the pool (0 = unlimited)
   */
  constructor(
    createFn: () => T,
    resetFn?: (obj: T) => void,
    initialSize = 0,
    maxSize = 0
  ) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;

    // Pre-allocate objects if requested
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  /**
   * Acquires an object from the pool or creates a new one if pool is empty.
   *
   * @returns An instance of T
   */
  acquire(): T {
    this.acquiredCount++;
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }

  /**
   * Returns an object to the pool for reuse.
   *
   * @param obj - The object to return to the pool
   */
  release(obj: T): void {
    this.releasedCount++;

    // Validate input
    if (obj === null || obj === undefined) {
      console.warn('Attempted to release null or undefined object to pool');
      return;
    }

    // Reset the object if a reset function was provided
    if (this.resetFn) {
      try {
        this.resetFn(obj);
      } catch (error) {
        console.warn('Error resetting object in pool:', error);
        // Continue with releasing the object even if reset fails
      }
    }

    // Add to pool if we're under the max size (or if maxSize is 0 for unlimited)
    if (this.maxSize === 0 || this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
    // If pool is at max capacity, the object will be garbage collected
  }

  /**
   * Gets the current size of the pool.
   *
   * @returns Number of objects currently in the pool
   */
  get size(): number {
    return this.pool.length;
  }

  /**
   * Gets statistics about pool usage.
   *
   * @returns Object containing pool statistics
   */
  getStats(): {
    size: number;
    acquired: number;
    released: number;
    utilization: number;
  } {
    return {
      size: this.pool.length,
      acquired: this.acquiredCount,
      released: this.releasedCount,
      utilization:
        this.acquiredCount > 0
          ? Math.min(1, this.releasedCount / this.acquiredCount)
          : 0,
    };
  }

  /**
   * Clears all objects from the pool.
   */
  clear(): void {
    this.pool.length = 0;
    // Note: We don't reset acquired/released counts to preserve historical data
  }

  /**
   * Resets pool statistics.
   */
  resetStats(): void {
    this.acquiredCount = 0;
    this.releasedCount = 0;
  }
}
