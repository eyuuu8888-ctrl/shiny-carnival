import { useEffect, useState } from 'preact/hooks';
import { ConfigStore, DEFAULT_CONFIG, type AppConfig } from '@linuxdo-summary/core';
import { extStorage } from '../../src/ext-storage';

const store = new ConfigStore(extStorage);

export function Popup() {
  const [cfg, setCfg] = useState<AppConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    store.load().then(setCfg);
  }, []);

  const openOptions = () => {
    const api = (globalThis as any).browser?.runtime ?? (globalThis as any).chrome?.runtime;
    if (api?.openOptionsPage) api.openOptionsPage();
  };

  const openCurrentLinuxDo = () => {
    const api = (globalThis as any).browser?.tabs ?? (globalThis as any).chrome?.tabs;
    api?.create?.({ url: 'https://linux.do' });
  };

  const configured = !!cfg.apiKey;

  return (
    <div class="popup-root lds-root">
      <h1>Linux.do 智能总结</h1>
      <p>
        在任意 <code>linux.do/t/*</code> 帖子页面右下角点击浮动按钮即可开始总结。
      </p>
      <p>
        当前状态：{configured ? '✅ 已配置 API Key' : '⚠️ 尚未配置 API Key'}
      </p>
      <div class="row">
        <button class="lds-panel__btn lds-panel__btn--primary" onClick={openOptions}>
          打开设置
        </button>
        <button class="lds-panel__btn" onClick={openCurrentLinuxDo}>
          前往 Linux.do
        </button>
      </div>
    </div>
  );
}
