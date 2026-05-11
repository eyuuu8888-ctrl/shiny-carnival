/** A single post / reply extracted from a Linux.do topic page. */
export interface TopicPost {
  /** Post index on the page (1-based). The first one is the OP. */
  index: number;
  /** Display name or username of the author. */
  author: string;
  /** ISO timestamp string if available. */
  createdAt?: string;
  /** Raw HTML of the post body. */
  html: string;
  /** Plain text content (HTML stripped, whitespace-normalized). */
  text: string;
  /** Number of likes if available. */
  likes?: number;
}

/** The full topic payload that will be sent to the LLM. */
export interface TopicPayload {
  title: string;
  url: string;
  posts: TopicPost[];
}

/** User-configurable settings persisted via the storage adapter. */
export interface AppConfig {
  apiBaseUrl: string;
  apiKey: string;
  model: string;
  /** Soft limit on how many posts (OP + replies) to send to LLM. */
  maxPosts: number;
  /** Optional custom system prompt override. */
  systemPrompt?: string;
  /** Response language hint. */
  language: 'zh' | 'en';
}

export const DEFAULT_CONFIG: AppConfig = {
  apiBaseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  maxPosts: 30,
  language: 'zh',
};
