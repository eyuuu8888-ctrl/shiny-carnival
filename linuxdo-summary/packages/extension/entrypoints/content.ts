import { defineContentScript } from 'wxt/sandbox';
import { mountApp } from '@linuxdo-summary/ui';
import { isLinuxDoTopicPage } from '@linuxdo-summary/core';
import { extStorage } from '../src/ext-storage';

export default defineContentScript({
  matches: ['https://linux.do/t/*'],
  runAt: 'document_idle',
  main() {
    const tryStart = () => {
      if (!isLinuxDoTopicPage()) return;
      if (document.getElementById('linuxdo-summary-root')) return;
      mountApp({ storage: extStorage });
    };

    tryStart();

    // Discourse is a SPA — watch for in-app navigation.
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    history.pushState = function (...args) {
      const r = origPush.apply(this, args as Parameters<typeof origPush>);
      setTimeout(tryStart, 300);
      return r;
    };
    history.replaceState = function (...args) {
      const r = origReplace.apply(this, args as Parameters<typeof origReplace>);
      setTimeout(tryStart, 300);
      return r;
    };
    window.addEventListener('popstate', () => setTimeout(tryStart, 300));
  },
});
