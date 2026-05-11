import type { StorageAdapter } from '@linuxdo-summary/core';

/**
 * StorageAdapter backed by `browser.storage.local` (WXT's polyfilled API,
 * usable in both Chrome MV3 and Firefox MV2/MV3).
 *
 * We fall back to `chrome.storage` if `browser` isn't available (e.g. when
 * running inside a minimal content-script host).
 */
type StorageArea = {
  get(keys: string | string[]): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
};

function getArea(): StorageArea {
  // WXT injects a `browser` polyfill global in extension entrypoints.
  // Typed loosely to avoid a hard dependency on @types/webextension-polyfill.
  const g = globalThis as unknown as {
    browser?: { storage?: { local?: StorageArea } };
    chrome?: { storage?: { local?: StorageArea } };
  };
  const area = g.browser?.storage?.local ?? g.chrome?.storage?.local;
  if (!area) {
    throw new Error('browser.storage.local is not available in this context');
  }
  return area;
}

export const extStorage: StorageAdapter = {
  async get<T>(key: string, fallback: T): Promise<T> {
    try {
      const out = await getArea().get(key);
      const v = out[key];
      return (v === undefined ? fallback : (v as T));
    } catch {
      return fallback;
    }
  },
  async set<T>(key: string, value: T): Promise<void> {
    await getArea().set({ [key]: value });
  },
};
