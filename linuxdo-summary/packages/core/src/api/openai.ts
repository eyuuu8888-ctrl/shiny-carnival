import type { AppConfig, TopicPayload } from '../types.js';
import { buildSystemPrompt, buildUserPrompt } from './prompt.js';

export interface SummarizeOptions {
  config: AppConfig;
  topic: TopicPayload;
  /** Called with each streamed delta chunk. */
  onDelta?: (delta: string) => void;
  signal?: AbortSignal;
}

/** Minimal shape of a streamed OpenAI-compatible chat completion chunk. */
interface StreamChunk {
  choices?: Array<{ delta?: { content?: string } }>;
}

/**
 * Call an OpenAI-compatible `/chat/completions` endpoint with streaming.
 * Returns the full concatenated content once the stream ends.
 */
export async function summarizeTopic(opts: SummarizeOptions): Promise<string> {
  const { config, topic, onDelta, signal } = opts;
  if (!config.apiKey) {
    throw new Error('API Key 未配置，请先在设置中填写。');
  }

  const url = `${config.apiBaseUrl.replace(/\/+$/, '')}/chat/completions`;
  const body = {
    model: config.model,
    stream: true,
    messages: [
      { role: 'system', content: buildSystemPrompt(config) },
      { role: 'user', content: buildUserPrompt(topic, config.maxPosts) },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => '');
    throw new Error(`LLM 请求失败 (${res.status}): ${errText.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let full = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames separated by \n\n
    let sep: number;
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      for (const line of frame.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') continue;
        try {
          const chunk = JSON.parse(payload) as StreamChunk;
          const delta = chunk.choices?.[0]?.delta?.content ?? '';
          if (delta) {
            full += delta;
            onDelta?.(delta);
          }
        } catch {
          // Ignore malformed frames (keep-alives, etc.)
        }
      }
    }
  }

  return full;
}
