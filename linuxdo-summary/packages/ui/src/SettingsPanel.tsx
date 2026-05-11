import { useState } from 'preact/hooks';
import type { AppConfig } from '@linuxdo-summary/core';

interface Props {
  config: AppConfig;
  onClose: () => void;
  onSave: (next: AppConfig) => void | Promise<void>;
}

export function SettingsPanel({ config, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<AppConfig>(config);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof AppConfig>(key: K, value: AppConfig[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class="lds-panel" role="dialog" aria-label="设置">
      <div class="lds-panel__header">
        <div class="lds-panel__title">设置</div>
        <button class="lds-panel__btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div class="lds-panel__body">
        <form class="lds-settings" onSubmit={(e) => e.preventDefault()}>
          <label>
            API Base URL
            <input
              type="text"
              value={draft.apiBaseUrl}
              placeholder="https://api.openai.com/v1"
              onInput={(e) => update('apiBaseUrl', (e.target as HTMLInputElement).value)}
            />
            <span class="lds-settings__hint">
              OpenAI 兼容端点，不含 /chat/completions。例如 DeepSeek: https://api.deepseek.com/v1
            </span>
          </label>

          <label>
            Model
            <input
              type="text"
              value={draft.model}
              placeholder="gpt-4o-mini"
              onInput={(e) => update('model', (e.target as HTMLInputElement).value)}
            />
          </label>

          <label>
            API Key
            <input
              type="password"
              value={draft.apiKey}
              placeholder="sk-..."
              onInput={(e) => update('apiKey', (e.target as HTMLInputElement).value)}
            />
          </label>

          <label>
            最多发送帖子数
            <input
              type="number"
              min={1}
              max={200}
              value={draft.maxPosts}
              onInput={(e) =>
                update('maxPosts', Number((e.target as HTMLInputElement).value) || 30)
              }
            />
            <span class="lds-settings__hint">
              原帖 + 回复总数。过多可能超过模型上下文或费用。
            </span>
          </label>

          <label>
            输出语言
            <select
              value={draft.language}
              onChange={(e) =>
                update('language', (e.target as HTMLSelectElement).value as 'zh' | 'en')
              }
            >
              <option value="zh">简体中文</option>
              <option value="en">English</option>
            </select>
          </label>

          <label>
            自定义 System Prompt（可选）
            <textarea
              value={draft.systemPrompt ?? ''}
              placeholder="留空则使用内置提示词"
              onInput={(e) => update('systemPrompt', (e.target as HTMLTextAreaElement).value)}
            />
          </label>
        </form>
      </div>

      <div class="lds-panel__footer">
        <button class="lds-panel__btn" onClick={onClose}>
          取消
        </button>
        <button
          class="lds-panel__btn lds-panel__btn--primary"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? '保存中…' : '保存'}
        </button>
      </div>
    </div>
  );
}
