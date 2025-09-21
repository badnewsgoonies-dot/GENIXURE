// Promise-based data loader with normalization and robust fallbacks
// Guarantees data readiness before UI initialization

class HEICDataLoader {
  constructor() {
    this.data = null;
    this.error = null;
    this.isLoaded = false;
    this.loadPromise = null;
  }

  async load() {
    if (this.loadPromise) return this.loadPromise;
    
    this.loadPromise = this._attemptLoad();
    return this.loadPromise;
  }

  async _attemptLoad() {
    const sources = [
      // Source 1: Already bundled global (most common case)
      () => this._loadFromGlobal(),
      
      // Source 2: Fetch from canonical locations
      () => this._fetchFromUrl('./details.json'),
      () => this._fetchFromUrl('./compiled_details.json'),
      () => this._fetchFromUrl('./data/details.json'),
      () => this._fetchFromUrl('/details.json'),
      
      // Source 3: Dynamic import (if available)
      () => this._dynamicImport('./details.js'),
      
      // Source 4: Fallback empty data
      () => this._fallbackEmpty()
    ];

    for (const source of sources) {
      try {
        const result = await source();
        if (result && this._validateData(result)) {
          this.data = this._normalizeData(result);
          this.isLoaded = true;
          console.log('[HEIC Loader] Successfully loaded data with', Object.keys(this.data).length, 'items');
          return this.data;
        }
      } catch (err) {
        console.warn('[HEIC Loader] Source failed:', err.message);
        continue;
      }
    }

    // All sources failed
    this.error = new Error('Failed to load data from all sources');
    throw this.error;
  }

  _loadFromGlobal() {
    if (window.HEIC_DETAILS && typeof window.HEIC_DETAILS === 'object') {
      console.log('[HEIC Loader] Using bundled global data');
      return window.HEIC_DETAILS;
    }
    throw new Error('Global data not available');
  }

  async _fetchFromUrl(url) {
    console.log('[HEIC Loader] Fetching from:', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  }

  async _dynamicImport(path) {
    console.log('[HEIC Loader] Dynamic import from:', path);
    const module = await import(path);
    return module.default || module.HEIC_DETAILS || module;
  }

  _fallbackEmpty() {
    console.warn('[HEIC Loader] Using empty fallback data');
    return {};
  }

  _validateData(data) {
    if (!data || typeof data !== 'object') return false;
    
    // Check if it's a reasonable HEIC data structure
    const keys = Object.keys(data);
    if (keys.length === 0) return false;
    
    // Look for HEIC-like patterns
    const hasHeicItems = keys.some(key => 
      key.includes('items/') || 
      key.includes('weapons/') || 
      key.includes('sets/') ||
      key.includes('upgrades/')
    );
    
    return hasHeicItems;
  }

  _normalizeData(data) {
    const normalized = {};
    
    for (const [key, item] of Object.entries(data)) {
      if (!item || typeof item !== 'object') continue;
      
      normalized[key] = {
        // Core properties
        name: item.name || 'Unknown',
        slug: item.slug || key.split('/').pop(),
        bucket: item.bucket || this._inferBucket(key),
        
        // Stats (with defaults)
        stats: {
          armor: (item.stats?.armor || 0),
          attack: (item.stats?.attack || 0),
          health: (item.stats?.health || 0),
          speed: (item.stats?.speed || 0)
        },
        
        // Tags and effects
        tags: Array.isArray(item.tags) ? item.tags : [],
        effects: Array.isArray(item.effects) ? item.effects : [],
        effect: item.effect || '',
        
        // Additional properties
        rarity: item.rarity || 'Common',
        tier: item.tier || 'base',
        
        // Preserve any other properties
        ...Object.fromEntries(
          Object.entries(item).filter(([key]) => 
            !['name', 'slug', 'bucket', 'stats', 'tags', 'effects', 'effect', 'rarity', 'tier'].includes(key)
          )
        )
      };
    }
    
    return normalized;
  }

  _inferBucket(key) {
    if (key.startsWith('items/')) return 'items';
    if (key.startsWith('weapons/')) return 'weapons';
    if (key.startsWith('sets/')) return 'sets';
    if (key.startsWith('upgrades/')) return 'upgrades';
    return 'items'; // default
  }

  // Public API
  getData() {
    return this.data;
  }

  getError() {
    return this.error;
  }

  isReady() {
    return this.isLoaded;
  }

  getHealth() {
    if (!this.isLoaded) return { status: 'loading', items: 0, errors: [] };
    if (this.error) return { status: 'error', items: 0, errors: [this.error.message] };
    
    const itemCount = this.data ? Object.keys(this.data).length : 0;
    return {
      status: itemCount > 0 ? 'healthy' : 'empty',
      items: itemCount,
      errors: [],
      buckets: this._getBucketCounts()
    };
  }

  _getBucketCounts() {
    if (!this.data) return {};
    
    const buckets = {};
    Object.values(this.data).forEach(item => {
      const bucket = item.bucket || 'unknown';
      buckets[bucket] = (buckets[bucket] || 0) + 1;
    });
    
    return buckets;
  }
}

// Create singleton instance
const dataLoader = new HEICDataLoader();

// Export ready promise
export const dataReady = dataLoader.load();
export default dataLoader;