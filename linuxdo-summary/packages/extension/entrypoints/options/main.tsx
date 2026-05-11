import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { ConfigStore, type AppConfig } from '@linuxdo-summary/core';
import { SettingsPanel, uiStyles } from '@linuxdo-summary/ui';
import { extStorage } from '../../src/ext-storage';

const style = document.createElement('style');
style.textContent =
  uiStyles +
  `
  body { margin: 0; padding: 24px; background: var(--lds-bg); color: var(--lds-fg);
         font-family: inherit; }
  .options-root { max-width: 560px; margin: 0 auto; }
  .options-root h1 { font-size: 16px; margin: 0 0 14px; }
  .options-root .lds-panel { position: static; width: auto; max-height: none;
                             box-shadow: none; }
`;
document.head.appendChild(style);

const store = new ConfigStore(extStorage);

function Options() {
  const [cfg, setCfg] = useState<AppConfig | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    store.load().then(setCfg);
  }, []);

  if (!cfg) return <div class="options-root lds-root">加载中…</div>;

  return (
    <div class="options-root lds-root">
      <h1>Linux.do 智能总结 — 设置</h1>
      <SettingsPanel
        config={cfg}
        onClose={() => {
          /* Options page has no "close" — ignore. */
        }}
        onSave={async (next) => {
          await store.save(next);
          setCfg(next);
          setSavedAt(new Date().toLocaleTimeString());
        }}
      />
      {savedAt && <p style="margin-top:8px; color: var(--lds-muted);">已保存 @ {savedAt}</p>}
    </div>
  );
}

render(<Options />, document.getElementById('app')!);
