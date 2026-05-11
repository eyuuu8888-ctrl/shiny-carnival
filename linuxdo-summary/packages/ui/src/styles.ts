/**
 * UI styles as a raw string.
 *
 * We can't `import './styles.css'` here because this package is consumed
 * directly as source by both userscript and extension builds, and neither
 * wants a CSS side-effect at the root. Instead, consumers inject this into
 * their shadow root (or the page) via a <style> element.
 */
export const styles = /* css */ `
:host, .lds-root {
  --lds-bg: #ffffff;
  --lds-fg: #1f2328;
  --lds-muted: #6e7781;
  --lds-border: #d0d7de;
  --lds-accent: #0969da;
  --lds-accent-fg: #ffffff;
  --lds-surface: #f6f8fa;
  --lds-danger: #cf222e;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Microsoft YaHei", sans-serif;
  color: var(--lds-fg);
}

@media (prefers-color-scheme: dark) {
  :host, .lds-root {
    --lds-bg: #1f2328;
    --lds-fg: #e6edf3;
    --lds-muted: #8d96a0;
    --lds-border: #30363d;
    --lds-accent: #4493f8;
    --lds-surface: #262c36;
  }
}

.lds-float-btn {
  position: fixed;
  right: 24px;
  bottom: 80px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--lds-accent);
  color: var(--lds-accent-fg);
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  font-size: 18px;
  z-index: 2147483640;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;
}
.lds-float-btn:hover { transform: scale(1.08); }

.lds-panel {
  position: fixed;
  right: 24px;
  bottom: 136px;
  width: min(420px, calc(100vw - 48px));
  max-height: calc(100vh - 160px);
  background: var(--lds-bg);
  border: 1px solid var(--lds-border);
  border-radius: 10px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 2147483641;
}

.lds-panel__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--lds-border);
  background: var(--lds-surface);
}
.lds-panel__title { flex: 1; font-weight: 600; font-size: 14px; }
.lds-panel__btn {
  background: transparent;
  border: 1px solid var(--lds-border);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  color: var(--lds-fg);
}
.lds-panel__btn:hover { background: var(--lds-surface); }
.lds-panel__btn--primary {
  background: var(--lds-accent);
  color: var(--lds-accent-fg);
  border-color: var(--lds-accent);
}
.lds-panel__btn--primary:hover { filter: brightness(1.05); }
.lds-panel__btn[disabled] { opacity: 0.5; cursor: not-allowed; }

.lds-panel__body {
  flex: 1;
  overflow: auto;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.65;
}
.lds-panel__body h1, .lds-panel__body h2, .lds-panel__body h3 {
  margin: 0.8em 0 0.4em;
}
.lds-panel__body pre {
  background: var(--lds-surface);
  padding: 8px;
  border-radius: 6px;
  overflow: auto;
}
.lds-panel__body code { background: var(--lds-surface); padding: 0 3px; border-radius: 3px; }
.lds-panel__body blockquote {
  border-left: 3px solid var(--lds-border);
  color: var(--lds-muted);
  padding: 0 10px;
  margin: 8px 0;
}

.lds-panel__footer {
  border-top: 1px solid var(--lds-border);
  padding: 8px 12px;
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  background: var(--lds-surface);
}

.lds-panel__error {
  color: var(--lds-danger);
  padding: 10px 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.lds-settings { display: flex; flex-direction: column; gap: 10px; }
.lds-settings label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--lds-muted); }
.lds-settings input, .lds-settings select, .lds-settings textarea {
  background: var(--lds-bg);
  color: var(--lds-fg);
  border: 1px solid var(--lds-border);
  border-radius: 6px;
  padding: 6px 8px;
  font: inherit;
  font-size: 13px;
}
.lds-settings textarea { min-height: 80px; resize: vertical; }
.lds-settings__hint { font-size: 11px; color: var(--lds-muted); margin-top: 2px; }
`;
