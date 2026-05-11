import { h, render } from 'preact';
import { App } from './App.js';
import { styles } from './styles.js';
import type { StorageAdapter } from '@linuxdo-summary/core';

export interface MountOptions {
  storage: StorageAdapter;
  /** Container id to attach to document.body. Defaults to 'linuxdo-summary-root'. */
  hostId?: string;
}

export interface MountHandle {
  host: HTMLElement;
  unmount(): void;
}

/**
 * Mount the widget inside an isolated shadow DOM so Linux.do's CSS can't leak in,
 * and our CSS can't leak out.
 */
export function mountApp(options: MountOptions): MountHandle {
  const hostId = options.hostId ?? 'linuxdo-summary-root';
  let host = document.getElementById(hostId) as HTMLElement | null;
  if (!host) {
    host = document.createElement('div');
    host.id = hostId;
    document.body.appendChild(host);
  }

  const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });

  // Inject styles (idempotent).
  if (!shadow.querySelector('style[data-lds-styles]')) {
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-lds-styles', '');
    styleEl.textContent = styles;
    shadow.appendChild(styleEl);
  }

  let mountPoint = shadow.querySelector('#lds-mount') as HTMLElement | null;
  if (!mountPoint) {
    mountPoint = document.createElement('div');
    mountPoint.id = 'lds-mount';
    shadow.appendChild(mountPoint);
  }

  render(h(App, { storage: options.storage }), mountPoint);

  return {
    host,
    unmount: () => unmountApp(host!),
  };
}

export function unmountApp(host: HTMLElement): void {
  const shadow = host.shadowRoot;
  const mountPoint = shadow?.querySelector('#lds-mount') as HTMLElement | null;
  if (mountPoint) render(null, mountPoint);
  host.remove();
}
