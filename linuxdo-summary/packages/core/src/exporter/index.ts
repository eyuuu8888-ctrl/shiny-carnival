import { renderMarkdown } from '../markdown/index.js';
import type { TopicPayload } from '../types.js';

/** Trigger a browser download of a text blob. */
export function downloadText(filename: string, content: string, mime = 'text/plain'): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Safe filename slice from a topic title. */
export function safeFilename(title: string, maxLen = 80): string {
  return title
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

export function exportSummaryAsMarkdown(topic: TopicPayload, summary: string): void {
  const md = `# ${topic.title}\n\n> 来源：${topic.url}\n\n${summary}\n`;
  downloadText(`${safeFilename(topic.title)}.summary.md`, md, 'text/markdown');
}

export function exportSummaryAsHtml(topic: TopicPayload, summary: string): void {
  const body = renderMarkdown(summary);
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(topic.title)} - 总结</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
         max-width: 760px; margin: 2rem auto; padding: 0 1rem; line-height: 1.7; color: #222; }
  h1, h2, h3 { line-height: 1.3; }
  code { background: #f4f4f4; padding: 0.1em 0.3em; border-radius: 3px; }
  pre { background: #f4f4f4; padding: 1em; overflow: auto; border-radius: 4px; }
  blockquote { border-left: 4px solid #ddd; color: #666; padding: 0.2em 1em; margin: 1em 0; }
  a { color: #0969da; }
  .meta { color: #888; font-size: 0.9em; margin-bottom: 2em; }
</style>
</head>
<body>
  <h1>${escapeHtml(topic.title)}</h1>
  <div class="meta">来源：<a href="${escapeHtml(topic.url)}">${escapeHtml(topic.url)}</a></div>
  ${body}
</body>
</html>`;
  downloadText(`${safeFilename(topic.title)}.summary.html`, html, 'text/html');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
