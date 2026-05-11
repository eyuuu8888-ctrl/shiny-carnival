import type { StorageAdapter } from '@linuxdo-summary/core';

/**
 * StorageAdapter backed by Tampermonkey's `GM_getValue` / `GM_setValue`.
 *
 * These APIs are synchronous, but we expose an async interface so the adapter
 * is swappable with the extension's `chrome.storage.local` adapter.
 */
export const gmStorage: StorageAdapter = {
  async get<T>(key: string, fallback: T): Promise<T> {
    try {
      const raw = GM_getValue(key, null as unknown as string | null);
      if (raw == null) return fallback;
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw) as T;
        } catch {
          return raw as unknown as T;
        }
      }
      return raw as T;
    } catch {
      return fallback;
    }
  },
  async set<T>(key: string, value: T): Promise<void> {
    GM_setValue(key, JSON.stringify(value));
  },
};
