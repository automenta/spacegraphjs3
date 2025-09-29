/**
 * Generic object pool implementation for recycling objects to reduce garbage collection.
 *
 * @template T - The type of objects managed by this pool
 */
export declare class ObjectPool<T> {
    private readonly createFn;
    private readonly resetFn?;
    private readonly pool;
    private readonly maxSize;
    /**
     * Creates a new ObjectPool.
     *
     * @param createFn - Function that creates new instances of T
     * @param resetFn - Optional function to reset objects when returning to pool
     * @param initialSize - Initial number of objects to pre-allocate
     * @param maxSize - Maximum size of the pool (0 = unlimited)
     */
    constructor(createFn: () => T, resetFn?: (obj: T) => void, initialSize?: number, maxSize?: number);
    /**
     * Acquires an object from the pool or creates a new one if pool is empty.
     *
     * @returns An instance of T
     */
    acquire(): T;
    /**
     * Returns an object to the pool for reuse.
     *
     * @param obj - The object to return to the pool
     */
    release(obj: T): void;
    /**
     * Gets the current size of the pool.
     *
     * @returns Number of objects currently in the pool
     */
    get size(): number;
    /**
     * Clears all objects from the pool.
     */
    clear(): void;
}
