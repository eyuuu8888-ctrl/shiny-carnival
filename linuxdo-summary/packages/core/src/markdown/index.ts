import { marked } from 'marked';

/** Render Markdown to HTML. Safe because we only inject into our own shadow DOM. */
export function renderMarkdown(md: string): string {
  return marked.parse(md, { async: false, gfm: true, breaks: true }) as string;
}
