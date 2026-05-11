import { mountApp } from '@linuxdo-summary/ui';
import { isLinuxDoTopicPage } from '@linuxdo-summary/core';
import { gmStorage } from './gm-storage.js';

function start() {
  if (!isLinuxDoTopicPage()) return;
  mountApp({ storage: gmStorage });
}

// Discourse is a SPA: the initial page may not be a topic, or may
// navigate between topics without a full reload. Re-check on history pushes.
function installSpaObserver() {
  const tryStart = () => {
    if (document.getElementById('linuxdo-summary-root')) return;
    start();
  };

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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    start();
    installSpaObserver();
  });
} else {
  start();
  installSpaObserver();
}
