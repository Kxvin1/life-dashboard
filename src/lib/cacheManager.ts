/**
 * Simple cache manager for handling cache invalidation after CRUD operations
 */

type CacheListener = () => void;

class CacheManager {
  private static instance: CacheManager;
  private cacheVersion: number = 0;
  private listeners: Set<CacheListener> = new Set();

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Invalidate cache by incrementing version
   * This forces all subsequent API calls to use fresh data
   */
  invalidateCache(): void {
    this.cacheVersion++;
    // Notify all listeners that cache has been invalidated
    this.listeners.forEach((listener) => listener());
  }

  /**
   * Subscribe to cache invalidation events
   */
  subscribe(listener: CacheListener): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current cache version to append to API calls
   */
  getCacheVersion(): number {
    return this.cacheVersion;
  }

  /**
   * Get cache-busting parameter for API calls
   * Only returns a parameter if cache has been invalidated
   */
  getCacheBustParam(): string {
    return this.cacheVersion > 0 ? `&_v=${this.cacheVersion}` : "";
  }

  /**
   * Get cache-busting parameter for API calls (for URLs without existing params)
   */
  getCacheBustParamFirst(): string {
    return this.cacheVersion > 0 ? `?_v=${this.cacheVersion}` : "";
  }
}

export const cacheManager = CacheManager.getInstance();
