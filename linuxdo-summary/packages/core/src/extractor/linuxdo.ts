import type { TopicPayload, TopicPost } from '../types.js';

/** Collapse whitespace and strip zero-width chars. */
function normalize(text: string): string {
  return text
    .replace(/\u200b|\u200c|\u200d|\ufeff/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Parse an integer from a string like "12 个赞" / "12". Returns undefined on failure. */
function parseInt10(s: string | null | undefined): number | undefined {
  if (!s) return undefined;
  const m = s.match(/\d+/);
  return m ? Number(m[0]) : undefined;
}

/**
 * Extract the currently-visible topic posts from a Linux.do topic page.
 *
 * Linux.do is a Discourse instance, so posts are rendered as `article[data-post-id]`
 * rows inside `.post-stream`. We parse the DOM directly — no network calls —
 * which means we are constrained by what's mounted in the virtual list. Callers
 * should consider scrolling through the thread first if they want full coverage.
 */
export function extractLinuxDoTopic(doc: Document = document): TopicPayload {
  const title =
    doc.querySelector('h1 .fancy-title')?.textContent?.trim() ??
    doc.querySelector('h1')?.textContent?.trim() ??
    doc.title.replace(/\s*-\s*LINUX DO.*$/i, '').trim();

  const articles = Array.from(doc.querySelectorAll<HTMLElement>('article[data-post-id]'));
  const posts: TopicPost[] = articles.map((el, i) => {
    const author =
      el.querySelector<HTMLElement>('.names .first')?.innerText.trim() ||
      el.querySelector<HTMLElement>('.names')?.innerText.trim() ||
      el.getAttribute('data-user-card') ||
      'unknown';

    const body = el.querySelector<HTMLElement>('.cooked');
    const html = body?.innerHTML ?? '';
    const text = normalize(body?.innerText ?? '');

    const createdAt =
      el.querySelector<HTMLTimeElement>('time')?.getAttribute('datetime') ?? undefined;

    const likes = parseInt10(el.querySelector('.post-likes-count, .like-count')?.textContent);

    const indexAttr = el.getAttribute('id')?.match(/post_(\d+)/)?.[1];
    return {
      index: indexAttr ? Number(indexAttr) : i + 1,
      author,
      createdAt,
      html,
      text,
      likes,
    };
  });

  return {
    title,
    url: doc.location?.href ?? '',
    posts,
  };
}

/** Rough heuristic: are we currently on a Linux.do topic page? */
export function isLinuxDoTopicPage(loc: Location = location): boolean {
  return loc.host.endsWith('linux.do') && /^\/t\//.test(loc.pathname);
}
