import { h, render } from 'preact';
import { uiStyles } from '@linuxdo-summary/ui';
import { Popup } from './Popup';

const style = document.createElement('style');
style.textContent =
  uiStyles +
  `
  body { margin: 0; padding: 0; min-width: 320px; }
  .popup-root { padding: 14px 16px; font-family: inherit; }
  .popup-root h1 { font-size: 14px; margin: 0 0 10px; }
  .popup-root p { margin: 6px 0; font-size: 12px; color: var(--lds-muted); }
  .popup-root .row { display: flex; gap: 8px; margin-top: 10px; }
`;
document.head.appendChild(style);

const mount = document.getElementById('app')!;
render(h(Popup, null), mount);
