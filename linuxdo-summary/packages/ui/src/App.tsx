import { useCallback, useEffect, useState } from 'preact/hooks';
import {
  ConfigStore,
  DEFAULT_CONFIG,
  exportSummaryAsHtml,
  exportSummaryAsMarkdown,
  extractLinuxDoTopic,
  summarizeTopic,
  type AppConfig,
  type StorageAdapter,
  type TopicPayload,
} from '@linuxdo-summary/core';
import { FloatButton } from './FloatButton.js';
import { SummaryPanel } from './SummaryPanel.js';
import { SettingsPanel } from './SettingsPanel.js';

interface AppProps {
  storage: StorageAdapter;
}

type View = 'closed' | 'summary' | 'settings';

/**
 * Top-level widget shared by userscript and extension builds.
 *
 * Flow:
 *   - Float button mounted always.
 *   - Click → ensure config, extract topic, stream summary into panel.
 *   - Settings panel is reachable from the summary panel header.
 */
export function App({ storage }: AppProps) {
  const [store] = useState(() => new ConfigStore(storage));
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [view, setView] = useState<View>('closed');
  const [topic, setTopic] = useState<TopicPayload | null>(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abortCtl, setAbortCtl] = useState<AbortController | null>(null);

  useEffect(() => {
    store.load().then(setConfig);
  }, [store]);

  const runSummary = useCallback(
    async (cfg: AppConfig) => {
      const t = extractLinuxDoTopic();
      setTopic(t);
      if (!t.posts.length) {
        setError('未能在当前页面找到帖子内容，请确认是一个 Linux.do 帖子页面。');
        return;
      }
      setSummary('');
      setError(null);
      setLoading(true);
      const ctl = new AbortController();
      setAbortCtl(ctl);
      try {
        await summarizeTopic({
          config: cfg,
          topic: t,
          signal: ctl.signal,
          onDelta: (d) => setSummary((s) => s + d),
        });
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setError((e as Error).message || String(e));
        }
      } finally {
        setLoading(false);
        setAbortCtl(null);
      }
    },
    [],
  );

  const handleOpen = useCallback(async () => {
    const cfg = await store.load();
    setConfig(cfg);
    if (!cfg.apiKey) {
      setView('settings');
      return;
    }
    setView('summary');
    runSummary(cfg);
  }, [store, runSummary]);

  const handleClose = useCallback(() => {
    abortCtl?.abort();
    setView('closed');
  }, [abortCtl]);

  const handleSaveConfig = useCallback(
    async (next: AppConfig) => {
      await store.save(next);
      setConfig(next);
      setView('summary');
      runSummary(next);
    },
    [store, runSummary],
  );

  return (
    <div class="lds-root">
      <FloatButton onClick={view === 'closed' ? handleOpen : handleClose} />

      {view === 'summary' && (
        <SummaryPanel
          title={topic?.title ?? '帖子总结'}
          summary={summary}
          loading={loading}
          error={error}
          onClose={handleClose}
          onRetry={() => runSummary(config)}
          onOpenSettings={() => setView('settings')}
          onExportMarkdown={() => topic && exportSummaryAsMarkdown(topic, summary)}
          onExportHtml={() => topic && exportSummaryAsHtml(topic, summary)}
        />
      )}

      {view === 'settings' && (
        <SettingsPanel
          config={config}
          onClose={() => setView(summary ? 'summary' : 'closed')}
          onSave={handleSaveConfig}
        />
      )}
    </div>
  );
}
