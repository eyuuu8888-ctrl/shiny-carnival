import { DEFAULT_CONFIG, type AppConfig } from '../types.js';

/**
 * Platform-agnostic storage contract.
 *
 * Userscript implementation wraps `GM_getValue` / `GM_setValue`.
 * Extension implementation wraps `chrome.storage.local`.
 */
export interface StorageAdapter {
  get<T>(key: string, fallback: T): Promise<T>;
  set<T>(key: string, value: T): Promise<void>;
}

const CONFIG_KEY = 'linuxdo-summary:config';

export class ConfigStore {
  constructor(private readonly storage: StorageAdapter) {}

  async load(): Promise<AppConfig> {
    const raw = await this.storage.get<Partial<AppConfig>>(CONFIG_KEY, {});
    return { ...DEFAULT_CONFIG, ...raw };
  }

  async save(config: AppConfig): Promise<void> {
    await this.storage.set(CONFIG_KEY, config);
  }

  async patch(patch: Partial<AppConfig>): Promise<AppConfig> {
    const current = await this.load();
    const next = { ...current, ...patch };
    await this.save(next);
    return next;
  }
}
