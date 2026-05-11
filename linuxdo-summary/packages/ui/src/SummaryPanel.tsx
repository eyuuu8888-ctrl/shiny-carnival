import { useMemo } from 'preact/hooks';
import { renderMarkdown } from '@linuxdo-summary/core';

interface Props {
  title: string;
  summary: string;
  loading: boolean;
  error?: string | null;
  onClose: () => void;
  onRetry: () => void;
  onOpenSettings: () => void;
  onExportMarkdown: () => void;
  onExportHtml: () => void;
}

export function SummaryPanel(props: Props) {
  const html = useMemo(() => (props.summary ? renderMarkdown(props.summary) : ''), [
    props.summary,
  ]);

  const canExport = !props.loading && !!props.summary && !props.error;

  return (
    <div class="lds-panel" role="dialog" aria-label="帖子总结">
      <div class="lds-panel__header">
        <div class="lds-panel__title">{props.title}</div>
        <button class="lds-panel__btn" onClick={props.onOpenSettings} title="设置">
          设置
        </button>
        <button class="lds-panel__btn" onClick={props.onClose} title="关闭">
          ✕
        </button>
      </div>

      <div class="lds-panel__body">
        {props.error ? (
          <div class="lds-panel__error">{props.error}</div>
        ) : props.summary ? (
          // eslint-disable-next-line react/no-danger
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : props.loading ? (
          <div>正在生成总结…</div>
        ) : (
          <div>点击"重新生成"开始。</div>
        )}
      </div>

      <div class="lds-panel__footer">
        <button
          class="lds-panel__btn"
          disabled={!canExport}
          onClick={props.onExportMarkdown}
          title="导出为 Markdown 文件"
        >
          导出 MD
        </button>
        <button
          class="lds-panel__btn"
          disabled={!canExport}
          onClick={props.onExportHtml}
          title="导出为离线 HTML"
        >
          导出 HTML
        </button>
        <button
          class="lds-panel__btn lds-panel__btn--primary"
          disabled={props.loading}
          onClick={props.onRetry}
        >
          {props.loading ? '生成中…' : '重新生成'}
        </button>
      </div>
    </div>
  );
}
