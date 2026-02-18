/**
 * CacheManager — LocalStorage wrapper
 * Updated for the new architecture (mostly used for user prefs now, data is real-time via Firestore)
 */
const CacheManager = {
  // We keep this for future offline-first features or simple key-value storage
  get(key) {
    try {
      const raw = localStorage.getItem(`ag_${key}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  set(key, data) {
    try {
      localStorage.setItem(`ag_${key}`, JSON.stringify(data));
    } catch (e) {
      console.warn('Cache write failed:', e);
    }
  },

  clear() {
    localStorage.clear();
  }
};
